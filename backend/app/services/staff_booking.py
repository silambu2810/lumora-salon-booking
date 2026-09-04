from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.schemas.booking import BookingUpdate


ALLOWED_STATUSES = {
    "pending",
    "confirmed",
    "completed",
    "cancelled",
}


def get_staff_bookings(
    db: Session,
    staff_id: int,
) -> list[Booking]:

    bookings = db.scalars(
        select(Booking)
        .where(
            Booking.staff_id == staff_id,
        )
        .order_by(
            Booking.booking_date.asc(),
            Booking.booking_time.asc(),
        )
    ).all()

    return bookings


def get_staff_booking(
    db: Session,
    staff_id: int,
    booking_id: int,
) -> Booking:

    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.staff_id == staff_id,
        )
    )

    if not booking:
        raise ValueError(
            "Booking not found"
        )

    return booking


def update_staff_booking(
    db: Session,
    staff_id: int,
    booking_id: int,
    data: BookingUpdate,
) -> Booking:

    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.staff_id == staff_id,
        )
    )

    if not booking:
        raise ValueError(
            "Booking not found"
        )

    # ---------------------------------------------------------
    # Validate status
    # ---------------------------------------------------------
    if data.status is not None:

        if data.status not in ALLOWED_STATUSES:
            raise ValueError(
                "Invalid booking status"
            )

        # Do not allow changing a cancelled booking
        # back into an active booking.
        if (
            booking.status == "cancelled"
            and data.status != "cancelled"
        ):
            raise ValueError(
                "Cancelled bookings cannot be reactivated"
            )

        booking.status = data.status

    # ---------------------------------------------------------
    # Update notes if supplied
    # ---------------------------------------------------------
    if data.notes is not None:
        booking.notes = data.notes

    try:
        db.commit()
        db.refresh(booking)

    except Exception:
        db.rollback()
        raise

    return booking