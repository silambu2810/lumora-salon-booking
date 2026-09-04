from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


# =========================================================
# Get All Staff
# =========================================================

def get_all_staff(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[User]:

    staff_members = db.scalars(
        select(User)
        .where(
            User.role == "staff"
        )
        .order_by(
            User.id.asc()
        )
        .offset(skip)
        .limit(limit)
    ).all()

    return list(staff_members)


# =========================================================
# Get Staff By ID
# =========================================================

def get_staff(
    db: Session,
    staff_id: int,
) -> User | None:

    return db.scalar(
        select(User).where(
            User.id == staff_id,
            User.role == "staff",
        )
    )


# =========================================================
# Deactivate Staff
# =========================================================

def deactivate_staff(
    db: Session,
    staff: User,
) -> User:

    if not staff.is_active:
        raise ValueError(
            "Staff account is already inactive"
        )

    staff.is_active = False

    try:
        db.commit()
        db.refresh(staff)

    except Exception:
        db.rollback()
        raise

    return staff