"""Alert management for GridGuard.

Evaluates LoadForecast output from predictor.py against alert thresholds
and creates Alert records when transformers transition to warning or critical
health status.
"""

from sqlalchemy.orm import Session

from models.alert import Alert
from models.telemetry import Telemetry
from services.predictor import LoadForecast


def get_alert_reason(forecast: LoadForecast) -> str:
    """Generate a plain-English reason for the alert."""
    if forecast.health_status == "critical":
        return f"Transformer load at {forecast.current_load:.1f}% (currently) and forecasted to reach {forecast.predicted_load:.1f}% in {forecast.horizon_seconds // 60} minutes. Critical overload risk."
    elif forecast.health_status == "warning":
        return f"Transformer load at {forecast.current_load:.1f}% (currently) and forecasted to reach {forecast.predicted_load:.1f}% in {forecast.horizon_seconds // 60} minutes. Approaching safe operating limits."
    return ""


def get_latest_temperature(db: Session, transformer_id: str) -> float | None:
    """Fetch the latest temperature reading for a transformer."""
    telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.transformer_id == transformer_id)
        .order_by(Telemetry.recorded_at.desc())
        .first()
    )
    return telemetry.temperature if telemetry else None


def check_active_alert_exists(db: Session, transformer_id: str, health_status: str) -> bool:
    """Check if an unresolved alert exists at the same status level for this transformer."""
    alert = (
        db.query(Alert)
        .filter(
            Alert.transformer_id == transformer_id,
            Alert.health_status == health_status,
            Alert.resolved_at.is_(None),
        )
        .first()
    )
    return alert is not None


def evaluate_and_create_alert(db: Session, forecast: LoadForecast) -> Alert | None:
    """Evaluate a LoadForecast and create an Alert if conditions warrant it.

    Returns the created Alert, or None if no alert was needed (e.g., transformer
    is healthy or an alert already exists at this status level).
    """
    if forecast.health_status == "healthy":
        return None

    # Only create a new alert if one doesn't already exist at this status level
    if check_active_alert_exists(db, forecast.transformer_id, forecast.health_status):
        return None

    alert_type = f"load_{forecast.health_status}"
    temperature = get_latest_temperature(db, forecast.transformer_id)
    reason = get_alert_reason(forecast)

    alert = Alert(
        transformer_id=forecast.transformer_id,
        alert_type=alert_type,
        health_status=forecast.health_status,
        current_load=forecast.current_load,
        predicted_load=forecast.predicted_load,
        temperature=temperature,
        reason=reason,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


def resolve_alert(db: Session, alert_id: int) -> Alert | None:
    """Mark an alert as resolved."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        from datetime import datetime, timezone

        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
    return alert


def get_active_alerts(db: Session, transformer_id: str | None = None) -> list[Alert]:
    """Fetch all unresolved alerts, optionally filtered by transformer."""
    query = db.query(Alert).filter(Alert.resolved_at.is_(None))
    if transformer_id:
        query = query.filter(Alert.transformer_id == transformer_id)
    return query.order_by(Alert.created_at.desc()).all()
