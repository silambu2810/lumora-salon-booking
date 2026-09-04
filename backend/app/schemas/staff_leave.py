from datetime import date

from pydantic import BaseModel, Field, model_validator


class StaffLeaveCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str | None = Field(
        default=None,
        max_length=255,
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError(
                "start_date must be before or equal to end_date"
            )

        return self


class StaffLeaveResponse(BaseModel):
    id: int
    staff_id: int
    start_date: date
    end_date: date
    reason: str | None

    model_config = {
        "from_attributes": True
    }