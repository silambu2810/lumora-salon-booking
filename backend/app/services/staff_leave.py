from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.staff_leave import StaffLeave
from app.models.user import User
from app.models.salon import Salon
from app.schemas.staff_leave import StaffLeaveCreate


def get_owner_salon(
    db: Session,
    owner_id: int,
) -> Salon:
    salon = db.scalar(
        select(Salon).where(Salon.owner_id == owner_id)
    )

    if not salon:
        raise ValueError(
            "Salon owner is not assigned to a salon"
        )

    return salon


def get_staff_for_owner(
    db: Session,
    owner_id: int,
    staff_id: int,
) -> User:
    salon = get_owner_salon(
        db=db,
        owner_id=owner_id,
    )

    staff = db.scalar(
        select(User).where(
            User.id == staff_id,
            User.role == "staff",
            User.salon_id == salon.id,
        )
    )

    if not staff:
        raise ValueError(
            "Staff member not found in your salon"
        )

    return staff


def create_staff_leave(
    db: Session,
    owner_id: int,
    staff_id: int,
    data: StaffLeaveCreate,
) -> StaffLeave:
    # -----------------------------------------------------
    # Make sure this staff member belongs to this owner
    # -----------------------------------------------------

    get_staff_for_owner(
        db=db,
        owner_id=owner_id,
        staff_id=staff_id,
    )

    # -----------------------------------------------------
    # Prevent overlapping leave periods
    # -----------------------------------------------------

    overlapping_leave = db.scalar(
        select(StaffLeave).where(
            StaffLeave.staff_id == staff_id,
            StaffLeave.start_date <= data.end_date,
            StaffLeave.end_date >= data.start_date,
        )
    )

    if overlapping_leave:
        raise ValueError(
            "Staff leave overlaps with an existing leave period"
        )

    # -----------------------------------------------------
    # Create leave
    # -----------------------------------------------------

    leave = StaffLeave(
        staff_id=staff_id,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
    )

    db.add(leave)
    db.commit()
    db.refresh(leave)

    return leave


def get_staff_leaves(
    db: Session,
    owner_id: int,
    staff_id: int,
) -> list[StaffLeave]:
    # -----------------------------------------------------
    # Verify that the staff member belongs to this owner
    # -----------------------------------------------------

    get_staff_for_owner(
        db=db,
        owner_id=owner_id,
        staff_id=staff_id,
    )

    return db.scalars(
        select(StaffLeave)
        .where(
            StaffLeave.staff_id == staff_id,
        )
        .order_by(
            StaffLeave.start_date
        )
    ).all()