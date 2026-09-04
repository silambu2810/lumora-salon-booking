from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.orm import Session, aliased

from app.models.booking import Booking
from app.models.salon import Salon
from app.models.service import Service
from app.models.user import User
from app.schemas.booking import BookingCreate
from app.services.availability import is_slot_available


# =============================================================
# USER ALIASES
# =============================================================

CustomerUser = aliased(User)
StaffUser = aliased(User)


# =============================================================
# BOOKING DETAIL QUERY
# =============================================================

def get_booking_with_details_query():
    return (
        select(
            Booking,
            Salon,
            Service,
            CustomerUser,
            StaffUser,
        )
        .join(
            Salon,
            Booking.salon_id == Salon.id,
        )
        .join(
            Service,
            Booking.service_id == Service.id,
        )
        .join(
            CustomerUser,
            Booking.user_id == CustomerUser.id,
        )
        .join(
            StaffUser,
            Booking.staff_id == StaffUser.id,
        )
    )


# =============================================================
# CONVERT BOOKING TO RESPONSE
# =============================================================

def booking_to_response(
    booking: Booking,
    salon: Salon,
    service: Service,
    customer: User,
    staff: User,
) -> dict:

    return {
        "id": booking.id,

        # Customer
        "user_id": booking.user_id,
        "customer_name": customer.name,

        # Salon
        "salon_id": booking.salon_id,
        "salon_name": salon.name,

        # Service
        "service_id": booking.service_id,
        "service_name": service.name,

        # Staff / Stylist
        "staff_id": booking.staff_id,
        "staff_name": staff.name,

        # Appointment
        "booking_date": booking.booking_date,
        "booking_time": booking.booking_time,

        "status": booking.status,
        "notes": booking.notes,

        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
    }


# =============================================================
# GET ONE BOOKING WITH DETAILS
# =============================================================

def get_booking_details(
    db: Session,
    booking_id: int,
):
    result = db.execute(
        get_booking_with_details_query().where(
            Booking.id == booking_id
        )
    ).first()

    if not result:
        return None

    (
        booking,
        salon,
        service,
        customer,
        staff,
    ) = result

    return booking_to_response(
        booking=booking,
        salon=salon,
        service=service,
        customer=customer,
        staff=staff,
    )


# =============================================================
# CREATE BOOKING
# =============================================================

def create_booking(
    db: Session,
    user_id: int,
    booking_data: BookingCreate,
):
    """
    Create a booking for an authenticated customer.

    A PostgreSQL transaction advisory lock is used for the
    selected stylist and date.

    This prevents two simultaneous booking requests from
    both passing the availability check and creating
    overlapping bookings.
    """

    # =========================================================
    # 1. CHECK SALON
    # =========================================================

    salon = db.scalar(
        select(Salon).where(
            Salon.id == booking_data.salon_id,
            Salon.is_active.is_(True),
        )
    )

    if not salon:
        raise ValueError(
            "Salon not found or inactive"
        )

    # =========================================================
    # 2. CHECK SERVICE
    # =========================================================

    service = db.scalar(
        select(Service).where(
            Service.id == booking_data.service_id,
            Service.salon_id == booking_data.salon_id,
            Service.is_active.is_(True),
        )
    )

    if not service:
        raise ValueError(
            "Service not found, inactive, or does not belong to this salon"
        )

    # =========================================================
    # 3. CHECK STAFF
    # =========================================================

    staff = db.scalar(
        select(User).where(
            User.id == booking_data.staff_id,
            User.role == "staff",
            User.salon_id == booking_data.salon_id,
            User.is_active.is_(True),
        )
    )

    if not staff:
        raise ValueError(
            "Staff member not found, inactive, or does not belong to this salon"
        )

    # =========================================================
    # 4. CONCURRENCY LOCK
    # =========================================================

    date_key = booking_data.booking_date.toordinal()

    db.execute(
        text(
            """
            SELECT pg_advisory_xact_lock(
                :staff_id,
                :date_key
            )
            """
        ),
        {
            "staff_id": booking_data.staff_id,
            "date_key": date_key,
        },
    )

    # =========================================================
    # 5. CHECK AVAILABILITY
    # =========================================================

    slot_available = is_slot_available(
        db=db,
        salon_id=booking_data.salon_id,
        service_id=booking_data.service_id,
        staff_id=booking_data.staff_id,
        booking_date=booking_data.booking_date,
        booking_time=booking_data.booking_time,
    )

    if not slot_available:
        db.rollback()

        raise ValueError(
            "Selected time slot is not available"
        )

    # =========================================================
    # 6. CREATE BOOKING
    # =========================================================

    booking = Booking(
        user_id=user_id,
        salon_id=booking_data.salon_id,
        service_id=booking_data.service_id,
        staff_id=booking_data.staff_id,
        booking_date=booking_data.booking_date,
        booking_time=booking_data.booking_time,
        status="pending",
        notes=booking_data.notes,
    )

    db.add(booking)

    # =========================================================
    # 7. COMMIT
    # =========================================================

    try:
        db.commit()
        db.refresh(booking)

    except Exception:
        db.rollback()
        raise

    # =========================================================
    # 8. LOAD BOOKING WITH RELATED NAMES
    # =========================================================

    response = get_booking_details(
        db=db,
        booking_id=booking.id,
    )

    if not response:
        raise ValueError(
            "Booking was created but could not be loaded"
        )

    return response


# =============================================================
# GET MY BOOKINGS
# =============================================================

def get_my_bookings(
    db: Session,
    user_id: int,
):
    results = db.execute(
        get_booking_with_details_query()
        .where(
            Booking.user_id == user_id
        )
        .order_by(
            Booking.booking_date.desc(),
            Booking.booking_time.desc(),
        )
    ).all()

    return [
        booking_to_response(
            booking=booking,
            salon=salon,
            service=service,
            customer=customer,
            staff=staff,
        )
        for (
            booking,
            salon,
            service,
            customer,
            staff,
        ) in results
    ]


# =============================================================
# GET MY SINGLE BOOKING
# =============================================================

def get_my_booking(
    db: Session,
    user_id: int,
    booking_id: int,
):
    result = db.execute(
        get_booking_with_details_query().where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
        )
    ).first()

    if not result:
        raise ValueError(
            "Booking not found"
        )

    (
        booking,
        salon,
        service,
        customer,
        staff,
    ) = result

    return booking_to_response(
        booking=booking,
        salon=salon,
        service=service,
        customer=customer,
        staff=staff,
    )


# =============================================================
# CANCEL MY BOOKING
# =============================================================

def cancel_my_booking(
    db: Session,
    user_id: int,
    booking_id: int,
):
    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
        )
    )

    if not booking:
        raise ValueError(
            "Booking not found"
        )

    if booking.status == "cancelled":
        raise ValueError(
            "Booking is already cancelled"
        )

    # =========================================================
    # DO NOT ALLOW CANCELLATION AFTER START
    # =========================================================

    booking_start = datetime.combine(
        booking.booking_date,
        booking.booking_time,
    )

    if booking_start < datetime.now():
        raise ValueError(
            "Past bookings cannot be cancelled"
        )

    # =========================================================
    # CANCEL
    # =========================================================

    booking.status = "cancelled"

    try:
        db.commit()
        db.refresh(booking)

    except Exception:
        db.rollback()
        raise

    # =========================================================
    # RETURN UPDATED BOOKING
    # =========================================================

    response = get_booking_details(
        db=db,
        booking_id=booking.id,
    )

    if not response:
        raise ValueError(
            "Booking was cancelled but could not be loaded"
        )

    return response