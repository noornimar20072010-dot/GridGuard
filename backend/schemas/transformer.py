from datetime import datetime
from typing import Literal

from pydantic import BaseModel

HealthStatus = Literal["healthy", "warning", "critical"]


class TransformerRead(BaseModel):
    """Transformer overview combining static info with its latest telemetry
    and prediction snapshot.

    current_load/predicted_load/health_status are computed by
    services/predictor.py, not stored as Transformer table columns.
    """

    id: str
    zone: str
    current_load: float
    predicted_load: float
    voltage: float
    current: float
    temperature: float
    health_status: HealthStatus
    last_updated: datetime
