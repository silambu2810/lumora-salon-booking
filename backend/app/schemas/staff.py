from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =========================================================
# Create Staff
# =========================================================

class StaffCreate(BaseModel):
    """
    Data required by a salon owner to create a staff member.

    salon_id is intentionally NOT accepted here.
    The backend gets the salon from the logged-in owner.
    """

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# =========================================================
# Staff Response
# =========================================================

class StaffResponse(BaseModel):
    """
    Public staff information returned by the API.
    """

    id: int
    name: str
    email: EmailStr
    phone: str
    role: str
    salon_id: int | None
    is_email_verified: bool
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )