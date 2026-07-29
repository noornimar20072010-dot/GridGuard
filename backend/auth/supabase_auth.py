import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas.user import AuthenticatedUser
from utils.config import SUPABASE_JWT_SECRET

# Supabase issues JWTs with the "authenticated" audience for logged-in users.
_SUPABASE_JWT_AUDIENCE = "authenticated"

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthenticatedUser:
    """Verify a Supabase Auth JWT and return the authenticated user.

    This relies entirely on Supabase's own token issuance (Supabase Auth) —
    it does not implement any custom login/password logic. Any route that
    depends on this function is rejected with 401 unless the request carries
    a valid, non-expired Supabase access token.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=_SUPABASE_JWT_AUDIENCE,
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return AuthenticatedUser(id=payload["sub"], email=payload.get("email"))
