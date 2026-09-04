from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# Service Base Schema
# =========================================================

class ServiceBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    price: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
    )

    duration_minutes: int = Field(
        ...,
        gt=0,
    )


# =========================================================
# Create Service
# =========================================================

class ServiceCreate(ServiceBase):
    salon_id: int = Field(
        ...,
        gt=0,
    )

    category_id: int | None = Field(
        default=None,
        gt=0,
    )


# =========================================================
# Update Service
# =========================================================

class ServiceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    price: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    duration_minutes: int | None = Field(
        default=None,
        gt=0,
    )

    category_id: int | None = Field(
        default=None,
        gt=0,
    )

    is_active: bool | None = None


# =========================================================
# Service Response
# =========================================================

class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    salon_id: int
    category_id: int | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )