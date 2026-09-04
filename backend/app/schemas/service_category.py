from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# Category Base Schema
# =========================================================

class ServiceCategoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# Create Category
# =========================================================

class ServiceCategoryCreate(ServiceCategoryBase):
    salon_id: int = Field(
        ...,
        gt=0,
    )


# =========================================================
# Update Category
# =========================================================

class ServiceCategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool | None = None


# =========================================================
# Category Response
# =========================================================

class ServiceCategoryResponse(ServiceCategoryBase):
    id: int
    salon_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )