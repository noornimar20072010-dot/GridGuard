"""Simulated telemetry generator for GridGuard transformers.

Produces realistic, correlated load/voltage/current/temperature readings on
an interval and persists them to the Telemetry table. Load follows a
mean-reverting random walk; voltage, current, and temperature are derived
from load (with their own noise and, for temperature, thermal inertia) so
the four readings move together the way real transformer telemetry would.
"""

import asyncio
import logging
import random
from dataclasses import dataclass
from datetime import datetime, timezone

from database.session import SessionLocal
from models.transformer import Transformer
from models.telemetry import Telemetry

logger = logging.getLogger(__name__)

RATED_CAPACITY_KVA = 500.0
NOMINAL_VOLTAGE = 230.0
RATED_CURRENT_AMPS = RATED_CAPACITY_KVA * 1000 / NOMINAL_VOLTAGE

LOAD_MIN_PERCENT = 5.0
LOAD_MAX_PERCENT = 130.0
LOAD_VOLATILITY = 4.0
LOAD_MEAN_REVERSION = 0.05

VOLTAGE_SAG_AT_FULL_LOAD = 6.0
VOLTAGE_NOISE = 1.5

CURRENT_NOISE_RATIO = 0.01

AMBIENT_TEMP_C = 25.0
TEMP_RISE_PER_LOAD_PERCENT = 0.6
TEMP_THERMAL_INERTIA = 0.15
TEMP_NOISE = 0.5


@dataclass
class TransformerState:
    transformer_id: str
    load_percent: float = 45.0
    temperature_c: float = AMBIENT_TEMP_C


@dataclass
class TelemetryReading:
    transformer_id: str
    load_percent: float
    voltage: float
    current: float
    temperature_c: float
    recorded_at: datetime


class TelemetryGenerator:
    """Simulates realistic transformer telemetry and persists each reading."""

    def __init__(self, transformer_ids=None):
        if transformer_ids is None:
            transformer_ids = self._load_transformer_ids()
        self._states = {tid: TransformerState(tid) for tid in transformer_ids}

    @staticmethod
    def _load_transformer_ids():
        if SessionLocal is None:
            raise RuntimeError("DATABASE_URL is not configured")
        db = SessionLocal()
        try:
            return [row.id for row in db.query(Transformer.id).all()]
        finally:
            db.close()

    def _step_load(self, state):
        # Mean-reverting random walk toward a fresh random target each tick,
        # so load wanders realistically instead of drifting to an extreme.
        target = LOAD_MIN_PERCENT + random.random() * (LOAD_MAX_PERCENT - LOAD_MIN_PERCENT)
        drift = (target - state.load_percent) * LOAD_MEAN_REVERSION
        noise = random.gauss(0, LOAD_VOLATILITY)
        new_load = state.load_percent + drift + noise
        return min(max(new_load, LOAD_MIN_PERCENT), LOAD_MAX_PERCENT)

    def _step_temperature(self, state, load_percent):
        # Temperature moves slowly toward a load-dependent target (thermal
        # inertia) rather than jumping instantly, matching real heat-up/cool-down.
        target_temp = AMBIENT_TEMP_C + load_percent * TEMP_RISE_PER_LOAD_PERCENT
        drift = (target_temp - state.temperature_c) * TEMP_THERMAL_INERTIA
        noise = random.gauss(0, TEMP_NOISE)
        return state.temperature_c + drift + noise

    def _derive_voltage(self, load_percent):
        sag = (load_percent / 100) * VOLTAGE_SAG_AT_FULL_LOAD
        noise = random.gauss(0, VOLTAGE_NOISE)
        return NOMINAL_VOLTAGE - sag + noise

    def _derive_current(self, load_percent):
        base = (load_percent / 100) * RATED_CURRENT_AMPS
        noise = random.gauss(0, RATED_CURRENT_AMPS * CURRENT_NOISE_RATIO)
        return max(base + noise, 0.0)

    def generate_reading(self, transformer_id):
        state = self._states[transformer_id]
        state.load_percent = self._step_load(state)
        state.temperature_c = self._step_temperature(state, state.load_percent)

        return TelemetryReading(
            transformer_id=transformer_id,
            load_percent=round(state.load_percent, 2),
            voltage=round(self._derive_voltage(state.load_percent), 2),
            current=round(self._derive_current(state.load_percent), 2),
            temperature_c=round(state.temperature_c, 2),
            recorded_at=datetime.now(timezone.utc),
        )

    def generate_all(self):
        return [self.generate_reading(tid) for tid in self._states]

    def tick(self):
        """Generate one reading per transformer and persist them in a batch."""
        if SessionLocal is None:
            raise RuntimeError("DATABASE_URL is not configured")

        readings = self.generate_all()
        db = SessionLocal()
        try:
            db.add_all(
                Telemetry(
                    transformer_id=reading.transformer_id,
                    load=reading.load_percent,
                    voltage=reading.voltage,
                    current=reading.current,
                    temperature=reading.temperature_c,
                    recorded_at=reading.recorded_at,
                )
                for reading in readings
            )
            db.commit()
        finally:
            db.close()

        for reading in readings:
            logger.info(
                "telemetry transformer=%s load=%.1f%% voltage=%.1fV current=%.1fA temp=%.1fC",
                reading.transformer_id,
                reading.load_percent,
                reading.voltage,
                reading.current,
                reading.temperature_c,
            )

    async def run(self, interval_seconds=5.0):
        """Continuously generate and persist readings for every transformer."""
        while True:
            self.tick()
            await asyncio.sleep(interval_seconds)
