from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="customer"
    )

    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # ---------------------------------------------------------
    # Salon
    # ---------------------------------------------------------
    # NULL for customers and admins.
    # Required logically for staff members.
    #
    # Example:
    # role = "staff"
    # salon_id = 1
    #
    # means this staff member belongs to Salon #1.
    # ---------------------------------------------------------

    salon_id: Mapped[int | None] = mapped_column(
        ForeignKey("salons.id"),
        nullable=True
    )

    salon = relationship(
        "Salon",
        foreign_keys=[salon_id],
        back_populates="staff"
    )

    # ---------------------------------------------------------
    # Created timestamp
    # ---------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

        # ---------------------------------------------------------
    # Customer Appointments
    # ---------------------------------------------------------

    customer_appointments = relationship(
        "Appointment",
        foreign_keys="Appointment.customer_id",
        back_populates="customer",
    )

    # ---------------------------------------------------------
    # Staff Appointments
    # ---------------------------------------------------------

    staff_appointments = relationship(
        "Appointment",
        foreign_keys="Appointment.staff_id",
        back_populates="staff",
    )