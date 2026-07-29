"""Transformer API service layer — queries live data from the database."""

from sqlalchemy.orm import Session

from database.session import SessionLocal
from models.telemetry import Telemetry
from models.transformer import Transformer
from schemas.telemetry import TelemetryRead
from schemas.transformer import TransformerRead
from services.predictor import get_recent_telemetry, forecast_load


def list_transformers() -> list[TransformerRead]:
    """List all transformers with live predictions."""
    db = SessionLocal()
    try:
        transformers = db.query(Transformer).all()
        result = []
        for transformer in transformers:
            telemetry_history = get_recent_telemetry(db, transformer.id)
            if not telemetry_history:
                continue

            forecast = forecast_load(telemetry_history)
            latest = telemetry_history[-1]

            result.append(
                TransformerRead(
                    id=transformer.id,
                    zone=transformer.zone,
                    current_load=forecast.current_load,
                    predicted_load=forecast.predicted_load,
                    voltage=round(latest.voltage, 2),
                    current=round(latest.current, 2),
                    temperature=round(latest.temperature, 2),
                    health_status=forecast.health_status,
                    last_updated=latest.recorded_at,
                )
            )
        return result
    finally:
        db.close()


def get_transformer(transformer_id: str) -> TransformerRead | None:
    """Fetch a single transformer with live prediction."""
    db = SessionLocal()
    try:
        transformer = db.query(Transformer).filter(Transformer.id == transformer_id).first()
        if not transformer:
            return None

        telemetry_history = get_recent_telemetry(db, transformer_id)
        if not telemetry_history:
            return None

        forecast = forecast_load(telemetry_history)
        latest = telemetry_history[-1]

        return TransformerRead(
            id=transformer.id,
            zone=transformer.zone,
            current_load=forecast.current_load,
            predicted_load=forecast.predicted_load,
            voltage=round(latest.voltage, 2),
            current=round(latest.current, 2),
            temperature=round(latest.temperature, 2),
            health_status=forecast.health_status,
            last_updated=latest.recorded_at,
        )
    finally:
        db.close()


def get_telemetry_history(transformer_id: str, points: int = 12) -> list[TelemetryRead] | None:
    """Fetch recent telemetry history for a transformer, oldest first."""
    db = SessionLocal()
    try:
        transformer = db.query(Transformer).filter(Transformer.id == transformer_id).first()
        if not transformer:
            return None

        rows = (
            db.query(Telemetry)
            .filter(Telemetry.transformer_id == transformer_id)
            .order_by(Telemetry.recorded_at.desc())
            .limit(points)
            .all()
        )
        rows = list(reversed(rows))

        return [
            TelemetryRead(
                id=row.id,
                transformer_id=row.transformer_id,
                load=round(row.load, 2),
                voltage=round(row.voltage, 2),
                current=round(row.current, 2),
                temperature=round(row.temperature, 2),
                recorded_at=row.recorded_at,
            )
            for row in rows
        ]
    finally:
        db.close()
