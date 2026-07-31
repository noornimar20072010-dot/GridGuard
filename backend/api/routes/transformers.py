from fastapi import APIRouter, Depends, HTTPException, status

from auth.supabase_auth import get_current_user
from schemas.telemetry import TelemetryRead
from schemas.transformer import TransformerRead
from schemas.user import AuthenticatedUser
from services import transformer_service

# Note: telemetry endpoint is public (no auth required) for dashboard/chart access

router = APIRouter(prefix="/transformers", tags=["transformers"])


@router.get("", response_model=list[TransformerRead])
def list_transformers(_user: AuthenticatedUser = Depends(get_current_user)) -> list[TransformerRead]:
    return transformer_service.list_transformers()


@router.get("/{transformer_id}", response_model=TransformerRead)
def get_transformer(
    transformer_id: str, _user: AuthenticatedUser = Depends(get_current_user)
) -> TransformerRead:
    transformer = transformer_service.get_transformer(transformer_id)
    if transformer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transformer not found")
    return transformer


@router.get("/{transformer_id}/telemetry", response_model=list[TelemetryRead])
def get_transformer_telemetry(
    transformer_id: str
) -> list[TelemetryRead]:
    history = transformer_service.get_telemetry_history(transformer_id)
    if history is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transformer not found")
    return history
