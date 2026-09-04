from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.admin_booking import AdminBookingUpdate
from app.schemas.booking import BookingResponse
from app.services.admin_booking import (
    get_all_bookings,
    get_booking,
    update_booking_status,
)


router = APIRouter(
    prefix="/admin/bookings",
    tags=["Admin Bookings"],
)


# =========================================================
# GET ALL BOOKINGS
# =========================================================
@router.get(
    "/",
    response_model=list[BookingResponse],
    status_code=status.HTTP_200_OK,
)
def get_all_bookings_endpoint(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return all bookings in the system.

    Admin only.
    """

    return get_all_bookings(
        db=db
    )


# =========================================================
# GET SINGLE BOOKING
# =========================================================
@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def get_booking_endpoint(
    booking_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return any booking in the system.

    Admin only.
    """

    try:
        return get_booking(
            db=db,
            booking_id=booking_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# =========================================================
# UPDATE BOOKING STATUS
# =========================================================
@router.put(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def update_booking_status_endpoint(
    booking_id: int,
    data: AdminBookingUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Update the status of any booking.

    Allowed statuses:
    - pending
    - confirmed
    - completed
    - cancelled

    Admin only.
    """

    try:
        return update_booking_status(
            db=db,
            booking_id=booking_id,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error