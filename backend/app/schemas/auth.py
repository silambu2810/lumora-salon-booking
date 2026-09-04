from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# Register
# =========================================================

class RegisterRequest(BaseModel):
    """
    Data required when a new customer registers.

    Public registration always creates a customer.
    The frontend cannot choose the role.
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
# Login
# =========================================================

class LoginRequest(BaseModel):
    """
    Data required when a user logs in.
    """

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# =========================================================
# Admin - Create User
# =========================================================

class AdminCreateUserRequest(BaseModel):
    """
    Data required by an admin to create a salon owner.

    The role is intentionally NOT included here.
    The backend automatically assigns:
        role = "salon_owner"
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
# User Response
# =========================================================

class UserResponse(BaseModel):
    """
    Public user information returned by the API.

    Never return password_hash to the frontend.
    """

    id: int

    name: str

    email: EmailStr

    phone: str

    role: str

    # -----------------------------------------------------
    # Salon assignment
    #
    # Customer/admin users may have no salon.
    # Salon owners and staff can have a salon.
    # -----------------------------------------------------

    salon_id: int | None = None

    is_email_verified: bool

    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# Authentication Response
# =========================================================

class TokenResponse(BaseModel):
    """
    Response returned after successful login.
    """

    access_token: str

    token_type: str = "bearer"

    user: UserResponse


# =========================================================
# Admin - Assign Salon Owner
# =========================================================

class AssignSalonOwnerRequest(BaseModel):
    """
    Data required when an admin assigns a salon owner
    to a salon.
    """

    owner_id: int = Field(
        ...,
        gt=0,
    )