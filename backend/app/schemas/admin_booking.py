from typing import Literal

from pydantic import BaseModel, Field


BookingStatus = Literal[
    "pending",
    "confirmed",
    "completed",
    "cancelled",
]


class AdminBookingUpdate(BaseModel):
    status: BookingStatus