from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# Salon Base Schema
# =========================================================

class SalonBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    address: str = Field(
        ...,
        min_length=5,
        max_length=500,
    )

    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
    )

    email: EmailStr | None = None

    description: str | None = Field(
        default=None,
        max_length=2000,
    )


# =========================================================
# Create Salon
# =========================================================

class SalonCreate(SalonBase):
    owner_id: int | None = Field(
        default=None,
        gt=0,
    )


# =========================================================
# Update Salon
# =========================================================

class SalonUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    address: str | None = Field(
        default=None,
        min_length=5,
        max_length=500,
    )

    phone: str | None = Field(
        default=None,
        min_length=10,
        max_length=20,
    )

    email: EmailStr | None = None

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    is_active: bool | None = None

    owner_id: int | None = Field(
        default=None,
        gt=0,
    )


# =========================================================
# Salon Response
# =========================================================

class SalonResponse(SalonBase):
    id: int

    is_active: bool

    created_at: datetime

    owner_id: int | None

    model_config = ConfigDict(
        from_attributes=True,
    )