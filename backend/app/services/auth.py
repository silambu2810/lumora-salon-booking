from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.otp import create_and_send_otp


# =========================================================
# Register User
# =========================================================

def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:
    """
    Register a new customer.

    Public registration always creates a customer account.
    The account starts as email-unverified and an OTP is sent
    to the registered email address.
    """

    # -----------------------------------------------------
    # 1. Check duplicate email
    # -----------------------------------------------------

    existing_email = db.scalar(
        select(User).where(User.email == data.email)
    )

    if existing_email:
        raise ValueError(
            "Email already registered"
        )

    # -----------------------------------------------------
    # 2. Check duplicate phone
    # -----------------------------------------------------

    existing_phone = db.scalar(
        select(User).where(User.phone == data.phone)
    )

    if existing_phone:
        raise ValueError(
            "Phone number already registered"
        )

    # -----------------------------------------------------
    # 3. Hash password
    # -----------------------------------------------------

    hashed_password = hash_password(
        data.password
    )

    # -----------------------------------------------------
    # 4. Create customer
    # -----------------------------------------------------

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hashed_password,

        # Public registration can ONLY create customers.
        role="customer",

        # Email must be verified using OTP.
        is_email_verified=False,

        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # -----------------------------------------------------
    # 5. Generate and send email OTP
    # -----------------------------------------------------

    try:
        create_and_send_otp(
            db=db,
            user=user,
        )

    except Exception as error:
        # Keep the newly created account.
        #
        # create_and_send_otp() already invalidates the OTP
        # when email delivery fails. The user can therefore
        # remain unverified and request a new OTP later.
        raise ValueError(
            "Registration succeeded, but we could not send "
            "the verification email. Please try again later."
        ) from error

    return user


# =========================================================
# Login User
# =========================================================

def login_user(
    db: Session,
    data: LoginRequest,
) -> tuple[str, User]:
    """
    Authenticate a user and return a JWT access token.

    Login requires:
    - valid email
    - valid password
    - verified email
    - active account
    """

    # -----------------------------------------------------
    # 1. Find user
    # -----------------------------------------------------

    user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if not user:
        raise ValueError(
            "Invalid email or password"
        )

    # -----------------------------------------------------
    # 2. Verify password
    # -----------------------------------------------------

    password_valid = verify_password(
        data.password,
        user.password_hash,
    )

    if not password_valid:
        raise ValueError(
            "Invalid email or password"
        )

    # -----------------------------------------------------
    # 3. Require email verification
    # -----------------------------------------------------

    if not user.is_email_verified:
        raise ValueError(
            "Email is not verified. "
            "Please verify your email first."
        )

    # -----------------------------------------------------
    # 4. Check account status
    # -----------------------------------------------------

    if not user.is_active:
        raise ValueError(
            "User account is inactive"
        )

    # -----------------------------------------------------
    # 5. Create JWT
    # -----------------------------------------------------

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    return access_token, user