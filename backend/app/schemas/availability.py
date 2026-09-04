from datetime import date, time

from pydantic import BaseModel, Field


class AvailabilityRequest(BaseModel):
    salon_id: int = Field(..., gt=0)
    service_id: int = Field(..., gt=0)
    staff_id: int = Field(..., gt=0)
    booking_date: date


class AvailabilityResponse(BaseModel):
    salon_id: int
    service_id: int
    staff_id: int
    booking_date: date
    available_slots: list[time]