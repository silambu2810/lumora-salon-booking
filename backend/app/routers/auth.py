from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    register_user,
    login_user,
)


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# Register
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new customer.
    """

    try:
        user = register_user(
            db=db,
            data=data,
        )

        return user

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Login
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login an existing user and return
    an access token.
    """

    try:
        access_token, user = login_user(
            db=db,
            data=data,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from error