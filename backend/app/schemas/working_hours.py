from datetime import time

from pydantic import BaseModel, Field, model_validator


class WorkingHoursCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    open_time: time | None = None
    close_time: time | None = None
    is_closed: bool = False

    @model_validator(mode="after")
    def validate_times(self):
        if self.is_closed:
            if self.open_time is not None or self.close_time is not None:
                raise ValueError(
                    "Closed days must not have open or close times"
                )
            return self

        if self.open_time is None or self.close_time is None:
            raise ValueError(
                "Open days must have both open_time and close_time"
            )

        if self.open_time >= self.close_time:
            raise ValueError(
                "Open time must be earlier than close time"
            )

        return self


class WorkingHoursUpdate(BaseModel):
    open_time: time | None = None
    close_time: time | None = None
    is_closed: bool = False

    @model_validator(mode="after")
    def validate_times(self):
        if self.is_closed:
            if self.open_time is not None or self.close_time is not None:
                raise ValueError(
                    "Closed days must not have open or close times"
                )
            return self

        if self.open_time is None or self.close_time is None:
            raise ValueError(
                "Open days must have both open_time and close_time"
            )

        if self.open_time >= self.close_time:
            raise ValueError(
                "Open time must be earlier than close time"
            )

        return self


class WorkingHoursResponse(BaseModel):
    id: int
    salon_id: int
    day_of_week: int
    open_time: time | None
    close_time: time | None
    is_closed: bool

    model_config = {"from_attributes": True}