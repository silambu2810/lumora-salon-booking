from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.schemas.admin_booking import AdminBookingUpdate


# =========================================================
# GET ALL BOOKINGS
# =========================================================
def get_all_bookings(
    db: Session,
) -> list[Booking]:

    bookings = db.scalars(
        select(Booking)
        .order_by(
            Booking.booking_date.desc(),
            Booking.booking_time.desc(),
            Booking.id.desc(),
        )
    ).all()

    return bookings


# =========================================================
# GET SINGLE BOOKING
# =========================================================
def get_booking(
    db: Session,
    booking_id: int,
) -> Booking:

    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id
        )
    )

    if not booking:
        raise ValueError(
            "Booking not found"
        )

    return booking


# =========================================================
# UPDATE BOOKING STATUS
# =========================================================
def update_booking_status(
    db: Session,
    booking_id: int,
    data: AdminBookingUpdate,
) -> Booking:

    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id
        )
    )

    if not booking:
        raise ValueError(
            "Booking not found"
        )

    # -----------------------------------------------------
    # Do not allow changing a completed booking
    # -----------------------------------------------------
    if (
        booking.status == "completed"
        and data.status != "completed"
    ):
        raise ValueError(
            "Completed bookings cannot be changed"
        )

    # -----------------------------------------------------
    # Do not update if status is already the same
    # -----------------------------------------------------
    if booking.status == data.status:
        raise ValueError(
            f"Booking is already {data.status}"
        )

    # -----------------------------------------------------
    # Update status
    # -----------------------------------------------------
    booking.status = data.status

    db.commit()
    db.refresh(booking)

    return booking