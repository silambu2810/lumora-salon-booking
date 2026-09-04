import secrets
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.otp import EmailOTP
from app.models.user import User
from app.services.email import send_otp_email


OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5


def generate_otp() -> str:
    """
    Generate a cryptographically secure six-digit OTP.
    """

    return f"{secrets.randbelow(1_000_000):06d}"


def create_and_send_otp(
    db: Session,
    user: User,
) -> None:

    # Invalidate previous unused OTPs
    previous_otps = db.scalars(
        select(EmailOTP).where(
            EmailOTP.user_id == user.id,
            EmailOTP.is_used.is_(False),
        )
    ).all()

    for old_otp in previous_otps:
        old_otp.is_used = True

    otp = generate_otp()

    otp_record = EmailOTP(
        user_id=user.id,
        otp_hash=hash_password(otp),
        expires_at=(
            datetime.utcnow()
            + timedelta(minutes=OTP_EXPIRY_MINUTES)
        ),
        is_used=False,
        attempts=0,
    )

    db.add(otp_record)
    db.commit()

    try:
        send_otp_email(
            recipient_email=user.email,
            otp=otp,
        )
    except Exception:
        # Don't leave a valid OTP behind if email delivery failed.
        otp_record.is_used = True
        db.commit()
        raise


def verify_email_otp(
    db: Session,
    user: User,
    otp_value: str,
) -> None:

    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user.id,
            EmailOTP.is_used.is_(False),
        )
        .order_by(EmailOTP.created_at.desc())
    )

    if not otp_record:
        raise ValueError(
            "No active OTP found. Please request a new OTP."
        )

    if otp_record.expires_at < datetime.utcnow():
        otp_record.is_used = True
        db.commit()

        raise ValueError(
            "OTP has expired. Please request a new OTP."
        )

    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        otp_record.is_used = True
        db.commit()

        raise ValueError(
            "Too many incorrect attempts. "
            "Please request a new OTP."
        )

    if not verify_password(
        otp_value,
        otp_record.otp_hash,
    ):
        otp_record.attempts += 1
        db.commit()

        raise ValueError(
            "Invalid OTP."
        )

    otp_record.is_used = True
    user.is_email_verified = True

    db.commit()