from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    # =========================================================
    # Primary Key
    # =========================================================

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # =========================================================
    # Service Information
    # =========================================================

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # =========================================================
    # Status
    # =========================================================

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # =========================================================
    # Salon
    # =========================================================

    salon_id: Mapped[int] = mapped_column(
        ForeignKey("salons.id"),
        nullable=False,
        index=True,
    )

    salon = relationship(
        "Salon",
        back_populates="services",
    )

    # =========================================================
    # Service Category
    # =========================================================

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("service_categories.id"),
        nullable=True,
        index=True,
    )

    category = relationship(
        "ServiceCategory",
        back_populates="services",
    )

    # =========================================================
    # Created At
    # =========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # =========================================================
    # Appointments
    # =========================================================

    appointments = relationship(
        "Appointment",
        back_populates="service",
    )