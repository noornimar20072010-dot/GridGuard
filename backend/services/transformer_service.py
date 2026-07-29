"""Temporary mock data layer for the transformer API routes.

TODO(Member 4): replace this with real queries against services/generator.py
(telemetry) and services/predictor.py (predicted_load, health_status) once
those land. The function signatures below are the contract the routes rely
on — keep them stable when swapping in the real implementation.
"""

from datetime import datetime, timedelta, timezone

from schemas.telemetry import TelemetryRead
from schemas.transformer import TransformerRead

_MOCK_TRANSFORMERS: dict[str, dict] = {
    "T-101": {"zone": "Zone A", "current_load": 62.0, "predicted_load": 68.0, "health_status": "healthy"},
    "T-102": {"zone": "Zone A", "current_load": 81.0, "predicted_load": 89.0, "health_status": "warning"},
    "T-103": {"zone": "Zone A", "current_load": 45.0, "predicted_load": 47.0, "health_status": "healthy"},
    "T-201": {"zone": "Zone B", "current_load": 94.0, "predicted_load": 102.0, "health_status": "critical"},
    "T-202": {"zone": "Zone B", "current_load": 58.0, "predicted_load": 60.0, "health_status": "healthy"},
}


def _to_transformer_read(transformer_id: str, data: dict) -> TransformerRead:
    return TransformerRead(
        id=transformer_id,
        zone=data["zone"],
        current_load=data["current_load"],
        predicted_load=data["predicted_load"],
        voltage=round(230 - data["current_load"] * 0.1, 1),
        current=round(data["current_load"] * 1.8, 1),
        temperature=round(40 + data["current_load"] * 0.3, 1),
        health_status=data["health_status"],
        last_updated=datetime.now(timezone.utc),
    )


def list_transformers() -> list[TransformerRead]:
    return [_to_transformer_read(tid, data) for tid, data in _MOCK_TRANSFORMERS.items()]


def get_transformer(transformer_id: str) -> TransformerRead | None:
    data = _MOCK_TRANSFORMERS.get(transformer_id)
    return _to_transformer_read(transformer_id, data) if data else None


def get_telemetry_history(transformer_id: str, points: int = 12) -> list[TelemetryRead] | None:
    """Recent telemetry history, oldest first, at 5-minute intervals."""
    data = _MOCK_TRANSFORMERS.get(transformer_id)
    if data is None:
        return None

    now = datetime.now(timezone.utc)
    base_load = data["current_load"]
    history = []
    for i in range(points):
        minutes_ago = (points - 1 - i) * 5
        # Gentle upward drift with light oscillation so the history looks
        # like a realistic approach to the current reading.
        load = round(base_load - minutes_ago * 0.15 + (i % 3 - 1) * 0.5, 1)
        history.append(
            TelemetryRead(
                id=i + 1,
                transformer_id=transformer_id,
                load=load,
                voltage=round(230 - load * 0.1, 1),
                current=round(load * 1.8, 1),
                temperature=round(40 + load * 0.3, 1),
                recorded_at=now - timedelta(minutes=minutes_ago),
            )
        )
    return history
