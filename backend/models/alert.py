from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from database.base import Base


class Alert(Base):
    """Alert triggered when a transformer's health status becomes warning or critical."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transformer_id = Column(String, ForeignKey("transformers.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String, nullable=False)  # e.g., "load_warning", "load_critical"
    health_status = Column(String, nullable=False)  # "warning" or "critical"
    current_load = Column(Float, nullable=False)
    predicted_load = Column(Float, nullable=False)
    temperature = Column(Float, nullable=True)
    reason = Column(String, nullable=False)  # Plain-English reason
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    transformer = relationship("Transformer", back_populates="alerts")
