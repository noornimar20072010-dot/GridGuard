"""Alert response schemas."""

from datetime import datetime

from pydantic import BaseModel


class AlertRead(BaseModel):
    """Alert response."""

    id: int
    transformer_id: str
    alert_type: str
    health_status: str
    current_load: float
    predicted_load: float
    temperature: float | None
    reason: str
    created_at: datetime
    resolved_at: datetime | None

    class Config:
        from_attributes = True
