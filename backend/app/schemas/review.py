from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    booking_id: int = Field(..., gt=0)

    rating: int = Field(
        ...,
        ge=1,
        le=5,
    )

    comment: str | None = Field(
        default=None,
        max_length=1000,
    )


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    salon_id: int
    staff_id: int
    rating: int
    comment: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )