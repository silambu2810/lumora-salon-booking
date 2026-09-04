from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# BOOKING BASE
# =========================================================

class BookingBase(BaseModel):
    salon_id: int = Field(
        ...,
        gt=0,
    )

    service_id: int = Field(
        ...,
        gt=0,
    )

    staff_id: int = Field(
        ...,
        gt=0,
    )

    booking_date: date

    booking_time: time

    notes: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# CREATE
# =========================================================

class BookingCreate(BookingBase):
    pass


# =========================================================
# UPDATE
# =========================================================

class BookingUpdate(BaseModel):

    booking_date: date | None = None

    booking_time: time | None = None

    staff_id: int | None = Field(
        default=None,
        gt=0,
    )

    status: str | None = Field(
        default=None,
        max_length=20,
    )

    notes: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# RESPONSE
# =========================================================

class BookingResponse(BaseModel):

    id: int

    # Customer
    user_id: int
    customer_name: str | None = None

    # Salon
    salon_id: int
    salon_name: str | None = None

    # Service
    service_id: int
    service_name: str | None = None

    # Stylist
    staff_id: int
    staff_name: str | None = None

    # Appointment
    booking_date: date
    booking_time: time

    status: str

    notes: str | None

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )