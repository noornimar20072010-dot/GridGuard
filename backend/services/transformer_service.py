"""Transformer data access layer.

Queries the database for transformers and their telemetry history.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from database.session import SessionLocal
from models.transformer import Transformer
from models.telemetry import Telemetry
from schemas.telemetry import TelemetryRead
from schemas.transformer import TransformerRead


def list_transformers() -> list[TransformerRead]:
    """List all transformers from the database."""
    db = SessionLocal()
    try:
        transformers = db.query(Transformer).all()
        result = []
        for t in transformers:
            # Get latest telemetry for each transformer
            latest = db.query(Telemetry).filter(
                Telemetry.transformer_id == t.id
            ).order_by(Telemetry.recorded_at.desc()).first()

            result.append(
                TransformerRead(
                    id=t.id,
                    zone=t.zone,
                    current_load=latest.load if latest else 0.0,
                    predicted_load=latest.load if latest else 0.0,
                    voltage=latest.voltage if latest else 0.0,
                    current=latest.current if latest else 0.0,
                    temperature=latest.temperature if latest else 0.0,
                    health_status="healthy",
                    last_updated=latest.recorded_at if latest else t.created_at,
                )
            )
        return result
    finally:
        db.close()


def get_transformer(transformer_id: str) -> TransformerRead | None:
    """Get a single transformer from the database."""
    db = SessionLocal()
    try:
        transformer = db.query(Transformer).filter(
            Transformer.id == transformer_id
        ).first()

        if not transformer:
            return None

        # Get latest telemetry
        latest = db.query(Telemetry).filter(
            Telemetry.transformer_id == transformer_id
        ).order_by(Telemetry.recorded_at.desc()).first()

        return TransformerRead(
            id=transformer.id,
            zone=transformer.zone,
            current_load=latest.load if latest else 0.0,
            predicted_load=latest.load if latest else 0.0,
            voltage=latest.voltage if latest else 0.0,
            current=latest.current if latest else 0.0,
            temperature=latest.temperature if latest else 0.0,
            health_status="healthy",
            last_updated=latest.recorded_at if latest else transformer.created_at,
        )
    finally:
        db.close()


def get_telemetry_history(transformer_id: str, points: int = 12) -> list[TelemetryRead] | None:
    """Get recent telemetry history for a transformer from the database."""
    db = SessionLocal()
    try:
        # Verify transformer exists
        transformer = db.query(Transformer).filter(
            Transformer.id == transformer_id
        ).first()

        if not transformer:
            return None

        # Get recent telemetry records, oldest first
        records = db.query(Telemetry).filter(
            Telemetry.transformer_id == transformer_id
        ).order_by(Telemetry.recorded_at.desc()).limit(points).all()

        if not records:
            return []

        return [
            TelemetryRead(
                id=t.id,
                transformer_id=t.transformer_id,
                load=t.load,
                voltage=t.voltage,
                current=t.current,
                temperature=t.temperature,
                recorded_at=t.recorded_at,
            )
            for t in reversed(records)
        ]
    finally:
        db.close()
