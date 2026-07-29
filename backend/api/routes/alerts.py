"""Alert management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from auth.supabase_auth import get_current_user
from database.session import SessionLocal
from models.alert import Alert
from schemas.user import AuthenticatedUser
from services import alert_manager, transformer_service
from services.ai_reporter import generate_operator_summary
from services.predictor import forecast_load, get_recent_telemetry

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/{transformer_id}/evaluate")
def evaluate_transformer_alerts(
    transformer_id: str,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Evaluate a transformer's prediction and create an alert if needed.

    This endpoint:
    1. Fetches recent telemetry for the transformer
    2. Runs predictor.py to forecast the load
    3. Evaluates the forecast against alert thresholds
    4. Creates an Alert record if conditions warrant it

    Returns the alert (if created) or None.
    """
    # Verify transformer exists (uses same lookup logic as GET /transformers/{id})
    transformer = transformer_service.get_transformer(transformer_id)
    if transformer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transformer not found")

    db = SessionLocal()
    try:

        # Get recent telemetry and forecast load
        telemetry = get_recent_telemetry(db, transformer_id)
        if not telemetry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No telemetry available for this transformer",
            )

        forecast = forecast_load(telemetry)

        # Evaluate and create alert if needed
        alert = alert_manager.evaluate_and_create_alert(db, forecast)

        return {
            "transformer_id": transformer_id,
            "forecast": {
                "current_load": forecast.current_load,
                "predicted_load": forecast.predicted_load,
                "health_status": forecast.health_status,
                "method": forecast.method,
            },
            "alert_created": alert is not None,
            "alert": {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "reason": alert.reason,
                "created_at": alert.created_at.isoformat(),
            }
            if alert
            else None,
        }
    finally:
        db.close()


@router.get("/active")
def get_active_alerts(_user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    """Fetch all unresolved alerts."""
    db = SessionLocal()
    try:
        alerts = alert_manager.get_active_alerts(db)
        return {
            "count": len(alerts),
            "alerts": [
                {
                    "id": alert.id,
                    "transformer_id": alert.transformer_id,
                    "alert_type": alert.alert_type,
                    "health_status": alert.health_status,
                    "current_load": alert.current_load,
                    "predicted_load": alert.predicted_load,
                    "reason": alert.reason,
                    "created_at": alert.created_at.isoformat(),
                }
                for alert in alerts
            ],
        }
    finally:
        db.close()


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Mark an alert as resolved."""
    db = SessionLocal()
    try:
        alert = alert_manager.resolve_alert(db, alert_id)
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        return {
            "id": alert.id,
            "resolved_at": alert.resolved_at.isoformat(),
        }
    finally:
        db.close()


@router.post("/{alert_id}/ai-summary")
def get_alert_ai_summary(
    alert_id: int,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Generate an AI-powered operator summary for a critical alert.

    This endpoint generates a plain-English summary explaining the alert
    situation and recommending action. It only works for critical alerts
    and is purely informational — the AI does not make decisions or modify
    any data.

    Returns the generated summary text.
    """
    db = SessionLocal()
    try:
        # Fetch the alert
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

        # Only generate summaries for critical alerts
        if alert.health_status != "critical":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="AI summaries are only generated for critical alerts",
            )

        # Generate the summary using Claude API
        summary = generate_operator_summary(
            transformer_id=alert.transformer_id,
            current_load=alert.current_load,
            predicted_load=alert.predicted_load,
            temperature=alert.temperature,
        )

        return {
            "alert_id": alert_id,
            "transformer_id": alert.transformer_id,
            "health_status": alert.health_status,
            "summary": summary,
        }

    finally:
        db.close()
