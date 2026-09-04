from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.admin_review import AdminReviewResponse
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review import (
    create_review,
    delete_review_for_admin,
    get_all_reviews_for_admin,
    get_my_reviews,
    get_review_for_admin,
    get_salon_reviews,
)


# =========================================================
# CUSTOMER / PUBLIC REVIEW ROUTER
# =========================================================

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


# =========================================================
# CREATE REVIEW
# =========================================================

@router.post(
    "/",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review_endpoint(
    review_data: ReviewCreate,
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Create a review for a completed booking.

    Rules:
    - Only customers can create reviews.
    - User must own the booking.
    - Booking must be completed.
    - A booking can only have one review.
    - Rating must be between 1 and 5.
    """

    try:
        return create_review(
            db=db,
            user_id=current_user.id,
            review_data=review_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# GET MY REVIEWS
# =========================================================

@router.get(
    "/my",
    response_model=list[ReviewResponse],
    status_code=status.HTTP_200_OK,
)
def get_my_reviews_endpoint(
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Return reviews created by the authenticated customer.
    """

    return get_my_reviews(
        db=db,
        user_id=current_user.id,
    )


# =========================================================
# GET SALON REVIEWS
# =========================================================

@router.get(
    "/salon/{salon_id}",
    response_model=list[ReviewResponse],
    status_code=status.HTTP_200_OK,
)
def get_salon_reviews_endpoint(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """
    Return reviews for a salon.

    Public endpoint so customers can see reviews
    before booking.
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    return get_salon_reviews(
        db=db,
        salon_id=salon_id,
    )


# =========================================================
# ADMIN REVIEW ROUTER
# =========================================================

admin_router = APIRouter(
    prefix="/admin/reviews",
    tags=["Admin Reviews"],
)


# =========================================================
# ADMIN - GET ALL REVIEWS
# =========================================================

@admin_router.get(
    "/",
    response_model=list[AdminReviewResponse],
    status_code=status.HTTP_200_OK,
)
def get_all_reviews_endpoint(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return all reviews for the admin dashboard.
    """

    return get_all_reviews_for_admin(
        db=db,
    )


# =========================================================
# ADMIN - GET SINGLE REVIEW
# =========================================================

@admin_router.get(
    "/{review_id}",
    response_model=AdminReviewResponse,
    status_code=status.HTTP_200_OK,
)
def get_single_review_endpoint(
    review_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return one review for admin inspection.
    """

    if review_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID",
        )

    try:
        return get_review_for_admin(
            db=db,
            review_id=review_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# =========================================================
# ADMIN - DELETE REVIEW
# =========================================================

@admin_router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review_endpoint(
    review_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Permanently delete a review.

    Only administrators can perform this action.
    """

    if review_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID",
        )

    try:
        delete_review_for_admin(
            db=db,
            review_id=review_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return None