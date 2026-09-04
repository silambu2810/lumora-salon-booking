from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Salon(Base):
    __tablename__ = "salons"

    # =========================================================
    # Primary Key
    # =========================================================

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # =========================================================
    # Salon Information
    # =========================================================

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # =========================================================
    # Salon Status
    # =========================================================

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
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
    # Salon Owner
    # =========================================================
    #
    # Admin can create a salon first and assign
    # the salon owner later.
    #
    # salons.owner_id → users.id
    # =========================================================

    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    owner = relationship(
        "User",
        foreign_keys=[owner_id],
    )

    # =========================================================
    # Staff Members
    # =========================================================
    #
    # Staff members are stored in the users table.
    #
    # role = "staff"
    # salon_id = 1
    #
    # means the staff member belongs to Salon #1.
    # =========================================================

    staff = relationship(
        "User",
        foreign_keys="User.salon_id",
        back_populates="salon",
    )

    # =========================================================
    # Services
    # =========================================================
    #
    # One salon can have many services.
    #
    # services.salon_id → salons.id
    # =========================================================

    services = relationship(
        "Service",
        back_populates="salon",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Service Categories
    # =========================================================
    #
    # One salon can have many service categories.
    #
    # service_categories.salon_id → salons.id
    # =========================================================

    service_categories = relationship(
        "ServiceCategory",
        back_populates="salon",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Appointments
    # =========================================================

    appointments = relationship(
        "Appointment",
        back_populates="salon",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Working Hours
    # =========================================================

    working_hours = relationship(
        "SalonWorkingHours",
        back_populates="salon",
        cascade="all, delete-orphan",
    )