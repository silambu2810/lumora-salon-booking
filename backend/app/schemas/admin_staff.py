from pydantic import BaseModel, EmailStr, ConfigDict


# =========================================================
# Admin Staff Response
# =========================================================

class AdminStaffResponse(BaseModel):
    """
    Staff information returned to administrators.
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