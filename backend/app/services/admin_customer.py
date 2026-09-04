from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.otp import EmailOTP
from app.models.booking import Booking
from app.models.appointment import Appointment
from app.models.review import Review
from app.schemas.admin_customer import AdminCustomerUpdate


# =========================================================
# Get All Customers
# =========================================================

def get_all_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[User]:

    statement = (
        select(User)
        .where(User.role == "customer")
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
    )

    return list(
        db.scalars(statement).all()
    )


# =========================================================
# Get Customer By ID
# =========================================================

def get_customer(
    db: Session,
    customer_id: int,
) -> User | None:

    statement = (
        select(User)
        .where(
            User.id == customer_id,
            User.role == "customer",
        )
    )

    return db.scalar(statement)


# =========================================================
# Update Customer
# =========================================================

def update_customer(
    db: Session,
    customer: User,
    customer_data: AdminCustomerUpdate,
) -> User:

    update_data = customer_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Check email uniqueness
    # -----------------------------------------------------

    if "email" in update_data:
        existing_email = db.scalar(
            select(User).where(
                User.email == update_data["email"],
                User.id != customer.id,
            )
        )

        if existing_email:
            raise ValueError(
                "Email is already registered"
            )

    # -----------------------------------------------------
    # Check phone uniqueness
    # -----------------------------------------------------

    if "phone" in update_data:
        existing_phone = db.scalar(
            select(User).where(
                User.phone == update_data["phone"],
                User.id != customer.id,
            )
        )

        if existing_phone:
            raise ValueError(
                "Phone number is already registered"
            )

    # -----------------------------------------------------
    # Update fields
    # -----------------------------------------------------

    for field, value in update_data.items():
        setattr(customer, field, value)

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(customer)

    except Exception:
        db.rollback()
        raise

    return customer


# =========================================================
# Deactivate Customer
# =========================================================

def deactivate_customer(
    db: Session,
    customer: User,
) -> User:

    if not customer.is_active:
        raise ValueError(
            "Customer account is already inactive"
        )

    customer.is_active = False

    try:
        db.commit()
        db.refresh(customer)

    except Exception:
        db.rollback()
        raise

    return customer


# =========================================================
# Delete Customer
# =========================================================

def delete_customer(
    db: Session,
    customer: User,
) -> None:

    # -----------------------------------------------------
    # Safety: only inactive customers
    # -----------------------------------------------------

    if customer.is_active:
        raise ValueError(
            "Only inactive customers can be permanently deleted"
        )

    # -----------------------------------------------------
    # Safety: only unverified customers
    # -----------------------------------------------------

    if customer.is_email_verified:
        raise ValueError(
            "Verified customers cannot be permanently deleted"
        )

    # -----------------------------------------------------
    # Safety: customer must have no bookings
    # -----------------------------------------------------

    has_booking = db.scalar(
        select(Booking.id)
        .where(
            Booking.user_id == customer.id
        )
        .limit(1)
    )

    if has_booking:
        raise ValueError(
            "Customer cannot be deleted because bookings exist"
        )

    # -----------------------------------------------------
    # Safety: customer must have no appointments
    # -----------------------------------------------------

    has_appointment = db.scalar(
        select(Appointment.id)
        .where(
            Appointment.customer_id == customer.id
        )
        .limit(1)
    )

    if has_appointment:
        raise ValueError(
            "Customer cannot be deleted because appointments exist"
        )

    # -----------------------------------------------------
    # Safety: customer must have no reviews
    # -----------------------------------------------------

    has_review = db.scalar(
        select(Review.id)
        .where(
            Review.user_id == customer.id
        )
        .limit(1)
    )

    if has_review:
        raise ValueError(
            "Customer cannot be deleted because reviews exist"
        )

    # -----------------------------------------------------
    # Delete OTP records first
    # -----------------------------------------------------

    db.execute(
        delete(EmailOTP).where(
            EmailOTP.user_id == customer.id
        )
    )

    # -----------------------------------------------------
    # Delete customer
    # -----------------------------------------------------

    db.delete(customer)

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise