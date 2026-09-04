from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    salon_id: Mapped[int] = mapped_column(
        ForeignKey("salons.id"),
        nullable=False,
        index=True,
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "booking_id",
            name="uq_reviews_booking",
        ),
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_reviews_rating_range",
        ),
    )