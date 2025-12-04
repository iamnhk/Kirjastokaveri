"""Security utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


def _is_bcrypt_hash(value: str) -> bool:
    """Return True when the stored hash uses the legacy bcrypt format."""
    return value.startswith(("$2a$", "$2b$", "$2y$"))


def is_legacy_hash(hashed_password: str) -> bool:
    """Expose legacy-hash detection for callers that want to upgrade hashes."""
    return _is_bcrypt_hash(hashed_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against

    Returns:
        True if the password matches, False otherwise
    """
    if _is_bcrypt_hash(hashed_password):
        plain_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")

        try:
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except ValueError:
            return bcrypt.checkpw(plain_bytes[:72], hashed_bytes)

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using PBKDF2-SHA256.

    Args:
        password: The plain text password to hash

    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


def _normalize_subject(payload: dict[str, Any]) -> dict[str, Any]:
    """Ensure the JWT subject claim is stored as a string."""
    normalized = payload.copy()
    sub = normalized.get("sub")
    if sub is not None:
        normalized["sub"] = str(sub)
    return normalized


def create_access_token(
    data: dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: The data to encode in the token (usually contains 'sub' with user identifier)
        expires_delta: Optional custom expiration time

    Returns:
        The encoded JWT token
    """
    to_encode = _normalize_subject(data)

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: The data to encode in the token (usually contains 'sub' with user identifier)

    Returns:
        The encoded JWT refresh token
    """
    to_encode = _normalize_subject(data)
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token to decode

    Returns:
        The decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def verify_token_type(token: str, expected_type: str) -> bool:
    """
    Verify that a token is of the expected type.

    Args:
        token: The JWT token to verify
        expected_type: The expected token type ('access' or 'refresh')

    Returns:
        True if the token is valid and of the expected type, False otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return False

    return payload.get("type") == expected_type
