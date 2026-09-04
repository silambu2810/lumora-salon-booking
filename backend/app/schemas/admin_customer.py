from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# Admin Customer Update
# =========================================================

class AdminCustomerUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        min_length=10,
        max_length=20,
    )

    is_active: bool | None = None


# =========================================================
# Admin Customer Response
# =========================================================

class AdminCustomerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: str
    is_email_verified: bool
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )