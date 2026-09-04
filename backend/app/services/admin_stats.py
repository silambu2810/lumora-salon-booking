from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.review import Review
from app.models.salon import Salon
from app.models.service import Service
from app.models.user import User


def get_admin_stats(db: Session) -> dict:
    # =====================================================
    # USER COUNTS
    # =====================================================

    total_customers = db.scalar(
        select(func.count(User.id)).where(
            User.role == "customer"
        )
    ) or 0

    total_salon_owners = db.scalar(
        select(func.count(User.id)).where(
            User.role == "salon_owner"
        )
    ) or 0

    total_staff = db.scalar(
        select(func.count(User.id)).where(
            User.role == "staff"
        )
    ) or 0

    total_admins = db.scalar(
        select(func.count(User.id)).where(
            User.role == "admin"
        )
    ) or 0

    # =====================================================
    # SALON COUNTS
    # =====================================================

    total_salons = db.scalar(
        select(func.count(Salon.id))
    ) or 0

    active_salons = db.scalar(
        select(func.count(Salon.id)).where(
            Salon.is_active.is_(True)
        )
    ) or 0

    # =====================================================
    # SERVICE COUNTS
    # =====================================================

    total_services = db.scalar(
        select(func.count(Service.id))
    ) or 0

    active_services = db.scalar(
        select(func.count(Service.id)).where(
            Service.is_active.is_(True)
        )
    ) or 0

    # =====================================================
    # BOOKING COUNTS
    # =====================================================

    total_bookings = db.scalar(
        select(func.count(Booking.id))
    ) or 0

    pending_bookings = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.status == "pending"
        )
    ) or 0

    confirmed_bookings = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.status == "confirmed"
        )
    ) or 0

    completed_bookings = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.status == "completed"
        )
    ) or 0

    cancelled_bookings = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.status == "cancelled"
        )
    ) or 0

    # =====================================================
    # REVIEW STATISTICS
    # =====================================================

    total_reviews = db.scalar(
        select(func.count(Review.id))
    ) or 0

    average_rating = db.scalar(
        select(func.avg(Review.rating))
    )

    if average_rating is not None:
        average_rating = round(float(average_rating), 2)

    # =====================================================
    # BOOKINGS BY SALON
    # =====================================================

    salon_booking_rows = db.execute(
        select(
            Salon.id,
            Salon.name,
            func.count(Booking.id),
        )
        .outerjoin(
            Booking,
            Booking.salon_id == Salon.id,
        )
        .group_by(
            Salon.id,
            Salon.name,
        )
        .order_by(
            func.count(Booking.id).desc(),
            Salon.id.asc(),
        )
    ).all()

    bookings_by_salon = [
        {
            "salon_id": salon_id,
            "salon_name": salon_name,
            "booking_count": booking_count,
        }
        for salon_id, salon_name, booking_count in salon_booking_rows
    ]

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "total_customers": total_customers,
        "total_salon_owners": total_salon_owners,
        "total_staff": total_staff,
        "total_admins": total_admins,

        "total_salons": total_salons,
        "active_salons": active_salons,

        "total_services": total_services,
        "active_services": active_services,

        "total_bookings": total_bookings,

        "booking_status": {
            "pending": pending_bookings,
            "confirmed": confirmed_bookings,
            "completed": completed_bookings,
            "cancelled": cancelled_bookings,
        },

        "total_reviews": total_reviews,
        "average_rating": average_rating,

        "bookings_by_salon": bookings_by_salon,
    }