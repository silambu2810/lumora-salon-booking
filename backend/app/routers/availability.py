from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.availability import (
    AvailabilityRequest,
    AvailabilityResponse,
)
from app.services.availability import get_available_slots


router = APIRouter(
    prefix="/availability",
    tags=["Availability"],
)


@router.post(
    "/",
    response_model=AvailabilityResponse,
    status_code=status.HTTP_200_OK,
)
def get_availability(
    data: AvailabilityRequest,
    db: Session = Depends(get_db),
):
    try:
        available_slots = get_available_slots(
            db=db,
            salon_id=data.salon_id,
            service_id=data.service_id,
            staff_id=data.staff_id,
            booking_date=data.booking_date,
        )

        return AvailabilityResponse(
            salon_id=data.salon_id,
            service_id=data.service_id,
            staff_id=data.staff_id,
            booking_date=data.booking_date,
            available_slots=available_slots,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error