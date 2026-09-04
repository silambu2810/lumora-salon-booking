from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.otp import (
    ResendOTPRequest,
    VerifyOTPRequest,
)
from app.services.otp import (
    create_and_send_otp,
    verify_email_otp,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# Verify Email OTP
# =========================================================

@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
)
def verify_email(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_email_verified:
        return {
            "message": "Email is already verified"
        }

    try:
        verify_email_otp(
            db=db,
            user=user,
            otp_value=data.otp,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return {
        "message": "Email verified successfully"
    }


# =========================================================
# Resend Email OTP
# =========================================================

@router.post(
    "/resend-otp",
    status_code=status.HTTP_200_OK,
)
def resend_otp(
    data: ResendOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_email_verified:
        return {
            "message": "Email is already verified"
        }

    try:
        create_and_send_otp(
            db=db,
            user=user,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send OTP email",
        ) from error

    return {
        "message": "OTP sent successfully"
    }