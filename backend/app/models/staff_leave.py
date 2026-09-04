from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StaffLeave(Base):
    __tablename__ = "staff_leaves"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    staff = relationship(
        "User",
        foreign_keys=[staff_id],
    )