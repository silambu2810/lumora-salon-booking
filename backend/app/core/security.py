from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from pwdlib import PasswordHash

from app.core.config import settings


# =========================================================
# Password Hashing
# =========================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password securely.

    Argon2 is used through pwdlib.
    """

    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against
    the stored password hash.
    """

    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# =========================================================
# JWT Access Token
# =========================================================

def create_access_token(
    user_id: int,
    role: str,
) -> str:
    """
    Create a JWT access token.

    Payload:
        sub  -> user ID
        role -> user role
        exp  -> expiration time
    """

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return token


# =========================================================
# Decode JWT Access Token
# =========================================================

def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises:
        JWTError: if the token is invalid or expired.
    """

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except JWTError as error:
        raise JWTError(
            "Invalid or expired access token"
        ) from error