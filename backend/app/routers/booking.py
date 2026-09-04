from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
)
from app.services.booking import (
    cancel_my_booking,
    create_booking,
    get_my_booking,
    get_my_bookings,
)


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)


# =========================================================
# CREATE BOOKING
# Customer only
# =========================================================

@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking_endpoint(
    booking_data: BookingCreate,
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Create a new booking for the authenticated customer.

    Validation includes:

    - active salon
    - active service
    - service belongs to salon
    - active staff
    - staff belongs to salon
    - working hours
    - staff leave
    - service duration
    - existing overlapping bookings
    - concurrent booking protection
    """

    try:
        return create_booking(
            db=db,
            user_id=current_user.id,
            booking_data=booking_data,
        )

    except ValueError as error:

        message = str(error)

        # -----------------------------------------------------
        # Existing / conflicting slot
        # -----------------------------------------------------

        if message == "Selected time slot is not available":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=message,
            ) from error

        # -----------------------------------------------------
        # Other validation errors
        # -----------------------------------------------------

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from error


# =========================================================
# GET MY BOOKINGS
# Customer only
# =========================================================

@router.get(
    "/my",
    response_model=list[BookingResponse],
    status_code=status.HTTP_200_OK,
)
def get_my_bookings_endpoint(
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Return all bookings belonging to the authenticated
    customer.
    """

    return get_my_bookings(
        db=db,
        user_id=current_user.id,
    )


# =========================================================
# GET MY SINGLE BOOKING
# Customer only
# =========================================================

@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def get_my_booking_endpoint(
    booking_id: int,
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Return one booking belonging to the authenticated
    customer.
    """

    if booking_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking ID",
        )

    try:
        return get_my_booking(
            db=db,
            user_id=current_user.id,
            booking_id=booking_id,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# =========================================================
# CANCEL MY BOOKING
# Customer only
# =========================================================

@router.put(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
)
def cancel_my_booking_endpoint(
    booking_id: int,
    current_user: User = Depends(
        require_roles("customer")
    ),
    db: Session = Depends(get_db),
):
    """
    Cancel a booking belonging to the authenticated customer.

    Cancellation is rejected when:

    - booking does not belong to customer
    - booking is already cancelled
    - appointment has already started
    """

    if booking_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking ID",
        )

    try:
        return cancel_my_booking(
            db=db,
            user_id=current_user.id,
            booking_id=booking_id,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error