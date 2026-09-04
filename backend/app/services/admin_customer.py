from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
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