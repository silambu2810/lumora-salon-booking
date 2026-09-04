from pydantic import BaseModel, EmailStr, Field


# =========================================================
# Verify Email OTP
# =========================================================

class VerifyOTPRequest(BaseModel):
    email: EmailStr

    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


# =========================================================
# Resend Email OTP
# =========================================================

class ResendOTPRequest(BaseModel):
    email: EmailStr