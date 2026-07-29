from datetime import datetime

from pydantic import BaseModel


class TelemetryRead(BaseModel):
    id: int
    transformer_id: str
    load: float
    voltage: float
    current: float
    temperature: float
    recorded_at: datetime

    model_config = {"from_attributes": True}
