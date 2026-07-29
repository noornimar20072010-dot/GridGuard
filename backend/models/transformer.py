from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.orm import relationship

from database.base import Base


class Transformer(Base):
    """Static transformer info. Current load, predicted load, and health
    status are computed from Telemetry by services/predictor.py, not stored
    here.
    """

    __tablename__ = "transformers"

    id = Column(String, primary_key=True)  # human-readable code, e.g. "T-101"
    zone = Column(String, nullable=False)  # e.g. "Zone A"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    telemetry = relationship("Telemetry", back_populates="transformer", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="transformer", cascade="all, delete-orphan")
