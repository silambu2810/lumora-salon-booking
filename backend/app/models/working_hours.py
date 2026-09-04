from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SalonWorkingHours(Base):
    __tablename__ = "salon_working_hours"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    salon_id: Mapped[int] = mapped_column(
        ForeignKey("salons.id"),
        nullable=False,
        index=True,
    )

    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day_of_week: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    open_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    close_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    is_closed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "salon_id",
            "day_of_week",
            name="uq_salon_working_hours_day",
        ),
    )

    salon = relationship(
        "Salon",
        back_populates="working_hours",
    )