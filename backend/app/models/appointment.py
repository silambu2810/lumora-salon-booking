from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    # ---------------------------------------------------------
    # Primary Key
    # ---------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # ---------------------------------------------------------
    # Customer
    # ---------------------------------------------------------
    #
    # The customer who made the appointment.
    #
    # appointments.customer_id -> users.id
    # ---------------------------------------------------------

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # Salon
    # ---------------------------------------------------------
    #
    # The salon where the appointment is booked.
    #
    # appointments.salon_id -> salons.id
    # ---------------------------------------------------------

    salon_id: Mapped[int] = mapped_column(
        ForeignKey("salons.id"),
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # Service
    # ---------------------------------------------------------
    #
    # The service selected by the customer.
    #
    # appointments.service_id -> services.id
    # ---------------------------------------------------------

    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # Staff
    # ---------------------------------------------------------
    #
    # Staff member handling the appointment.
    #
    # This is nullable because the salon may assign
    # a staff member later.
    #
    # appointments.staff_id -> users.id
    # ---------------------------------------------------------

    staff_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # ---------------------------------------------------------
    # Appointment Date & Time
    # ---------------------------------------------------------

    appointment_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    # ---------------------------------------------------------
    # Appointment Status
    # ---------------------------------------------------------
    #
    # Possible values:
    #
    # pending
    # confirmed
    # completed
    # cancelled
    #
    # We are using String here so it is easy to extend later.
    # ---------------------------------------------------------

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    # ---------------------------------------------------------
    # Customer Notes
    # ---------------------------------------------------------
    #
    # Optional message from the customer.
    #
    # Example:
    # "Please use a low fade."
    # ---------------------------------------------------------

    customer_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ---------------------------------------------------------
    # Staff Notes
    # ---------------------------------------------------------
    #
    # Internal notes for staff/salon.
    # ---------------------------------------------------------

    staff_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ---------------------------------------------------------
    # Created At
    # ---------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ---------------------------------------------------------
    # Updated At
    # ---------------------------------------------------------

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # ---------------------------------------------------------
    # Relationships
    # ---------------------------------------------------------

    customer = relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="customer_appointments",
    )

    salon = relationship(
        "Salon",
        foreign_keys=[salon_id],
        back_populates="appointments",
    )

    service = relationship(
        "Service",
        foreign_keys=[service_id],
        back_populates="appointments",
    )

    staff = relationship(
        "User",
        foreign_keys=[staff_id],
        back_populates="staff_appointments",
    )