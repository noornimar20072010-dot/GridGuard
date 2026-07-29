from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID

from database.base import Base


class User(Base):
    """Mirrors a row in Supabase's auth.users table (id is a foreign key to it).

    Created via a Supabase Auth trigger/function, not by this backend.
    """

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
