from datetime import datetime

from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    """Identity extracted from a verified Supabase Auth JWT."""

    id: str
    email: str | None = None


class UserRead(BaseModel):
    id: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
