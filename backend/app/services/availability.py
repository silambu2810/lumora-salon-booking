from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.salon import Salon
from app.models.service import Service
from app.models.staff_leave import StaffLeave
from app.models.user import User
from app.models.working_hours import SalonWorkingHours


# =============================================================
# CONFIGURATION
# =============================================================

SLOT_INTERVAL_MINUTES = 30


# =============================================================
# GET SALON
# =============================================================

def get_salon(
    db: Session,
    salon_id: int,
) -> Salon:

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id,
            Salon.is_active.is_(True),
        )
    )

    if not salon:
        raise ValueError(
            "Salon not found or inactive"
        )

    return salon


# =============================================================
# GET SERVICE
# =============================================================

def get_service(
    db: Session,
    salon_id: int,
    service_id: int,
) -> Service:

    service = db.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.salon_id == salon_id,
            Service.is_active.is_(True),
        )
    )

    if not service:
        raise ValueError(
            "Service not found, inactive, or does not belong to this salon"
        )

    return service


# =============================================================
# GET STAFF
# =============================================================

def get_staff(
    db: Session,
    salon_id: int,
    staff_id: int,
) -> User:

    staff = db.scalar(
        select(User).where(
            User.id == staff_id,
            User.role == "staff",
            User.salon_id == salon_id,
            User.is_active.is_(True),
        )
    )

    if not staff:
        raise ValueError(
            "Staff member not found, inactive, or does not belong to this salon"
        )

    return staff


# =============================================================
# GET WORKING HOURS
# =============================================================

def get_working_hours_for_date(
    db: Session,
    salon_id: int,
    booking_date: date,
) -> SalonWorkingHours | None:

    day_of_week = booking_date.weekday()

    return db.scalar(
        select(SalonWorkingHours).where(
            SalonWorkingHours.salon_id == salon_id,
            SalonWorkingHours.day_of_week == day_of_week,
        )
    )


# =============================================================
# STAFF LEAVE
# =============================================================

def staff_is_on_leave(
    db: Session,
    staff_id: int,
    booking_date: date,
) -> bool:

    leave = db.scalar(
        select(StaffLeave).where(
            StaffLeave.staff_id == staff_id,
            StaffLeave.start_date <= booking_date,
            StaffLeave.end_date >= booking_date,
        )
    )

    return leave is not None


# =============================================================
# EXISTING BOOKINGS
# =============================================================

def get_existing_bookings(
    db: Session,
    staff_id: int,
    booking_date: date,
) -> list[Booking]:

    return db.scalars(
        select(Booking).where(
            Booking.staff_id == staff_id,
            Booking.booking_date == booking_date,
            Booking.status != "cancelled",
        )
    ).all()


# =============================================================
# OVERLAP CHECK
# =============================================================

def booking_overlaps(
    booking_start: datetime,
    booking_end: datetime,
    existing_start: datetime,
    existing_end: datetime,
) -> bool:

    return (
        existing_start < booking_end
        and existing_end > booking_start
    )


# =============================================================
# CHECK ONE SLOT
# =============================================================

def is_slot_available(
    db: Session,
    salon_id: int,
    service_id: int,
    staff_id: int,
    booking_date: date,
    booking_time: time,
) -> bool:
    """
    Validate one specific booking slot.

    Used by:
        GET /availability
        POST /bookings

    Rules are kept here so the booking API cannot bypass
    availability validation.
    """

    # ---------------------------------------------------------
    # SALON
    # ---------------------------------------------------------

    salon = get_salon(
        db=db,
        salon_id=salon_id,
    )

    # ---------------------------------------------------------
    # SERVICE
    # ---------------------------------------------------------

    service = get_service(
        db=db,
        salon_id=salon.id,
        service_id=service_id,
    )

    # ---------------------------------------------------------
    # STAFF
    # ---------------------------------------------------------

    get_staff(
        db=db,
        salon_id=salon.id,
        staff_id=staff_id,
    )

    # ---------------------------------------------------------
    # BOOKING START
    # ---------------------------------------------------------

    booking_start = datetime.combine(
        booking_date,
        booking_time,
    )

    # ---------------------------------------------------------
    # NO PAST BOOKINGS
    # ---------------------------------------------------------

    if booking_start < datetime.now():
        return False

    # ---------------------------------------------------------
    # ONLY :00 AND :30
    # ---------------------------------------------------------

    if booking_time.minute not in (0, 30):
        return False

    if (
        booking_time.second != 0
        or booking_time.microsecond != 0
    ):
        return False

    # ---------------------------------------------------------
    # WORKING HOURS
    # ---------------------------------------------------------

    working_hours = get_working_hours_for_date(
        db=db,
        salon_id=salon.id,
        booking_date=booking_date,
    )

    if not working_hours:
        return False

    if working_hours.is_closed:
        return False

    if (
        working_hours.open_time is None
        or working_hours.close_time is None
    ):
        return False

    # ---------------------------------------------------------
    # SERVICE END
    # ---------------------------------------------------------

    booking_end = booking_start + timedelta(
        minutes=service.duration_minutes
    )

    salon_open = datetime.combine(
        booking_date,
        working_hours.open_time,
    )

    salon_close = datetime.combine(
        booking_date,
        working_hours.close_time,
    )

    # Before opening
    if booking_start < salon_open:
        return False

    # Service would finish after closing
    if booking_end > salon_close:
        return False

    # ---------------------------------------------------------
    # STAFF LEAVE
    # ---------------------------------------------------------

    if staff_is_on_leave(
        db=db,
        staff_id=staff_id,
        booking_date=booking_date,
    ):
        return False

    # ---------------------------------------------------------
    # EXISTING BOOKINGS
    # ---------------------------------------------------------

    existing_bookings = get_existing_bookings(
        db=db,
        staff_id=staff_id,
        booking_date=booking_date,
    )

    for existing_booking in existing_bookings:

        existing_service = db.scalar(
            select(Service).where(
                Service.id == existing_booking.service_id
            )
        )

        if not existing_service:
            continue

        existing_start = datetime.combine(
            existing_booking.booking_date,
            existing_booking.booking_time,
        )

        existing_end = (
            existing_start
            + timedelta(
                minutes=existing_service.duration_minutes
            )
        )

        if booking_overlaps(
            booking_start=booking_start,
            booking_end=booking_end,
            existing_start=existing_start,
            existing_end=existing_end,
        ):
            return False

    return True


# =============================================================
# ROUND UP TO NEXT 30-MINUTE SLOT
# =============================================================

def round_up_to_slot(
    value: datetime,
) -> datetime:
    """
    Convert an arbitrary time to the next :00 or :30 slot.

    Examples:

        09:00 -> 09:00
        09:10 -> 09:30
        09:30 -> 09:30
        09:31 -> 10:00
    """

    minutes = value.minute

    remainder = minutes % SLOT_INTERVAL_MINUTES

    if remainder == 0:
        return value.replace(
            second=0,
            microsecond=0,
        )

    return (
        value
        + timedelta(
            minutes=SLOT_INTERVAL_MINUTES - remainder
        )
    ).replace(
        second=0,
        microsecond=0,
    )


# =============================================================
# GET AVAILABLE SLOTS
# =============================================================

def get_available_slots(
    db: Session,
    salon_id: int,
    service_id: int,
    staff_id: int,
    booking_date: date,
) -> list[time]:

    salon = get_salon(
        db=db,
        salon_id=salon_id,
    )

    service = get_service(
        db=db,
        salon_id=salon.id,
        service_id=service_id,
    )

    get_staff(
        db=db,
        salon_id=salon.id,
        staff_id=staff_id,
    )

    # ---------------------------------------------------------
    # WORKING HOURS
    # ---------------------------------------------------------

    working_hours = get_working_hours_for_date(
        db=db,
        salon_id=salon.id,
        booking_date=booking_date,
    )

    if not working_hours:
        return []

    if working_hours.is_closed:
        return []

    if (
        working_hours.open_time is None
        or working_hours.close_time is None
    ):
        return []

    # ---------------------------------------------------------
    # STAFF LEAVE
    # ---------------------------------------------------------

    if staff_is_on_leave(
        db=db,
        staff_id=staff_id,
        booking_date=booking_date,
    ):
        return []

    # ---------------------------------------------------------
    # SALON OPEN/CLOSE
    # ---------------------------------------------------------

    salon_open = datetime.combine(
        booking_date,
        working_hours.open_time,
    )

    salon_close = datetime.combine(
        booking_date,
        working_hours.close_time,
    )

    # ---------------------------------------------------------
    # START AT FIRST VALID 30-MINUTE BOUNDARY
    # ---------------------------------------------------------

    current_start = round_up_to_slot(
        salon_open
    )

    # ---------------------------------------------------------
    # CURRENT TIME
    # ---------------------------------------------------------

    now = datetime.now()

    # ---------------------------------------------------------
    # GENERATE SLOTS
    # ---------------------------------------------------------

    slots: list[time] = []

    while True:

        current_end = (
            current_start
            + timedelta(
                minutes=service.duration_minutes
            )
        )

        # Service must finish before salon closes.
        if current_end > salon_close:
            break

        # Do not show past slots.
        if current_start >= now:

            if is_slot_available(
                db=db,
                salon_id=salon_id,
                service_id=service_id,
                staff_id=staff_id,
                booking_date=booking_date,
                booking_time=current_start.time(),
            ):
                slots.append(
                    current_start.time()
                )

        current_start += timedelta(
            minutes=SLOT_INTERVAL_MINUTES
        )

    return slots