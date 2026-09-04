from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    otp_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )