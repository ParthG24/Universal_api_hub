import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union
import bcrypt
from jose import jwt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Computes a bcrypt hash for the plain password."""
    # Bcrypt supports max 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def generate_api_key(prefix: str = "uah_live_") -> str:
    """
    Generates a cryptographically secure random API key.
    Returned to the user once upon creation or rotation.
    """
    token = secrets.token_urlsafe(32)
    return f"{prefix}{token}"


def hash_api_key(api_key: str) -> str:
    """
    Computes a deterministic SHA-256 hash of the API key for secure storage and indexed lookups.
    """
    return hashlib.sha256(api_key.strip().encode("utf-8")).hexdigest()


def create_access_token(subject: Union[str, Any], expires_delta: timedelta | None = None) -> str:
    """Creates a signed JWT access token for admin authentication."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
