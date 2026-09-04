from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class AdminReviewResponse(BaseModel):
    id: int

    booking_id: int

    user_id: int
    customer_name: str | None = None
    customer_email: EmailStr | None = None

    salon_id: int
    salon_name: str | None = None

    staff_id: int
    staff_name: str | None = None

    rating: int
    comment: str | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )