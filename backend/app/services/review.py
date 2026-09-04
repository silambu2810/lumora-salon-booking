from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.models.booking import Booking
from app.models.review import Review
from app.models.salon import Salon
from app.models.user import User
from app.schemas.review import ReviewCreate


# =========================================================
# CREATE REVIEW
# =========================================================

def create_review(
    db: Session,
    user_id: int,
    review_data: ReviewCreate,
) -> Review:

    # ---------------------------------------------------------
    # Find the booking
    # ---------------------------------------------------------

    booking = db.scalar(
        select(Booking).where(
            Booking.id == review_data.booking_id,
        )
    )

    if not booking:
        raise ValueError("Booking not found")

    # ---------------------------------------------------------
    # Booking ownership check
    # ---------------------------------------------------------

    if booking.user_id != user_id:
        raise ValueError(
            "You can only review your own booking"
        )

    # ---------------------------------------------------------
    # Booking must be completed
    # ---------------------------------------------------------

    if booking.status != "completed":
        raise ValueError(
            "You can only review a completed booking"
        )

    # ---------------------------------------------------------
    # Prevent duplicate review
    # ---------------------------------------------------------

    existing_review = db.scalar(
        select(Review).where(
            Review.booking_id == booking.id,
        )
    )

    if existing_review:
        raise ValueError(
            "This booking has already been reviewed"
        )

    # ---------------------------------------------------------
    # Verify customer exists and is active
    # ---------------------------------------------------------

    user = db.scalar(
        select(User).where(
            User.id == user_id,
        )
    )

    if not user:
        raise ValueError("User not found")

    if not user.is_active:
        raise ValueError(
            "User account is inactive"
        )

    # ---------------------------------------------------------
    # Create review
    # ---------------------------------------------------------

    review = Review(
        booking_id=booking.id,
        user_id=user_id,
        salon_id=booking.salon_id,
        staff_id=booking.staff_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )

    db.add(review)

    try:
        db.commit()
        db.refresh(review)

    except Exception:
        db.rollback()

        raise ValueError(
            "Could not create review"
        )

    return review


# =========================================================
# GET MY REVIEWS
# =========================================================

def get_my_reviews(
    db: Session,
    user_id: int,
) -> list[Review]:

    reviews = db.scalars(
        select(Review)
        .where(
            Review.user_id == user_id,
        )
        .order_by(
            Review.created_at.desc()
        )
    ).all()

    return list(reviews)


# =========================================================
# GET SALON REVIEWS
# =========================================================

def get_salon_reviews(
    db: Session,
    salon_id: int,
) -> list[Review]:

    reviews = db.scalars(
        select(Review)
        .where(
            Review.salon_id == salon_id,
        )
        .order_by(
            Review.created_at.desc()
        )
    ).all()

    return list(reviews)


# =========================================================
# ADMIN - GET ALL REVIEWS
# =========================================================

def get_all_reviews_for_admin(
    db: Session,
):
    """
    Return all reviews with customer, salon and
    stylist names for the admin dashboard.
    """

    staff_user = aliased(User)

    rows = db.execute(
        select(
            Review,
            User.name.label("customer_name"),
            User.email.label("customer_email"),
            Salon.name.label("salon_name"),
            staff_user.name.label("staff_name"),
        )
        .join(
            User,
            User.id == Review.user_id,
        )
        .join(
            Salon,
            Salon.id == Review.salon_id,
        )
        .join(
            staff_user,
            staff_user.id == Review.staff_id,
        )
        .order_by(
            Review.created_at.desc()
        )
    ).all()

    results = []

    for row in rows:
        review = row[0]

        results.append(
            {
                "id": review.id,
                "booking_id": review.booking_id,
                "user_id": review.user_id,
                "customer_name": row.customer_name,
                "customer_email": row.customer_email,
                "salon_id": review.salon_id,
                "salon_name": row.salon_name,
                "staff_id": review.staff_id,
                "staff_name": row.staff_name,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
            }
        )

    return results


# =========================================================
# ADMIN - GET SINGLE REVIEW
# =========================================================

def get_review_for_admin(
    db: Session,
    review_id: int,
):
    """
    Return one review with customer, salon and
    stylist information.
    """

    staff_user = aliased(User)

    row = db.execute(
        select(
            Review,
            User.name.label("customer_name"),
            User.email.label("customer_email"),
            Salon.name.label("salon_name"),
            staff_user.name.label("staff_name"),
        )
        .join(
            User,
            User.id == Review.user_id,
        )
        .join(
            Salon,
            Salon.id == Review.salon_id,
        )
        .join(
            staff_user,
            staff_user.id == Review.staff_id,
        )
        .where(
            Review.id == review_id,
        )
    ).first()

    if not row:
        raise ValueError("Review not found")

    review = row[0]

    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "user_id": review.user_id,
        "customer_name": row.customer_name,
        "customer_email": row.customer_email,
        "salon_id": review.salon_id,
        "salon_name": row.salon_name,
        "staff_id": review.staff_id,
        "staff_name": row.staff_name,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


# =========================================================
# ADMIN - DELETE REVIEW
# =========================================================

def delete_review_for_admin(
    db: Session,
    review_id: int,
):
    """
    Permanently remove a review.

    The booking itself is NOT deleted.
    """

    review = db.scalar(
        select(Review).where(
            Review.id == review_id,
        )
    )

    if not review:
        raise ValueError("Review not found")

    db.delete(review)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise ValueError(
            "Could not delete review"
        )

    return True