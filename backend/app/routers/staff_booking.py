from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.booking import BookingResponse, BookingUpdate
from app.services.staff_booking import (
    get_staff_booking,
    get_staff_bookings,
    update_staff_booking,
)


router = APIRouter(
    prefix="/staff/bookings",
    tags=["Staff Bookings"],
)


# =========================================================
# GET STAFF BOOKINGS
# =========================================================
@router.get(
    "/",
    response_model=list[BookingResponse],
    status_code=status.HTTP_200_OK,
)
def get_staff_bookings_endpoint(
    current_user: User = Depends(
        require_roles("staff")
    ),
    db: Session = Depends(get_db),
):
    """
    Return all bookings assigned to the authenticated staff member.
    """

    return get_staff_bookings(
        db=db,
        staff_id=current_user.id,
    )


# =========================================================
# GET SINGLE STAFF BOOKING
# =========================================================
@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def get_staff_booking_endpoint(
    booking_id: int,
    current_user: User = Depends(
        require_roles("staff")
    ),
    db: Session = Depends(get_db),
):
    """
    Return one booking assigned to the authenticated staff member.
    """

    try:
        return get_staff_booking(
            db=db,
            staff_id=current_user.id,
            booking_id=booking_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# =========================================================
# UPDATE STAFF BOOKING
# =========================================================
@router.put(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def update_staff_booking_endpoint(
    booking_id: int,
    data: BookingUpdate,
    current_user: User = Depends(
        require_roles("staff")
    ),
    db: Session = Depends(get_db),
):
    """
    Allow the assigned staff member to update booking status/notes.
    """

    try:
        return update_staff_booking(
            db=db,
            staff_id=current_user.id,
            booking_id=booking_id,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error