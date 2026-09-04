from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.salon import Salon
from app.models.working_hours import SalonWorkingHours
from app.schemas.working_hours import (
    WorkingHoursCreate,
    WorkingHoursUpdate,
)


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


def get_working_hours(
    db: Session,
    owner_id: int,
) -> list[SalonWorkingHours]:
    salon = get_owner_salon(db, owner_id)

    return db.scalars(
        select(SalonWorkingHours)
        .where(SalonWorkingHours.salon_id == salon.id)
        .order_by(SalonWorkingHours.day_of_week)
    ).all()


def create_working_hours(
    db: Session,
    owner_id: int,
    data: WorkingHoursCreate,
) -> SalonWorkingHours:
    salon = get_owner_salon(db, owner_id)

    existing = db.scalar(
        select(SalonWorkingHours).where(
            SalonWorkingHours.salon_id == salon.id,
            SalonWorkingHours.day_of_week == data.day_of_week,
        )
    )

    if existing:
        raise ValueError(
            "Working hours already exist for this day"
        )

    working_hours = SalonWorkingHours(
        salon_id=salon.id,
        day_of_week=data.day_of_week,
        open_time=data.open_time,
        close_time=data.close_time,
        is_closed=data.is_closed,
    )

    db.add(working_hours)
    db.commit()
    db.refresh(working_hours)

    return working_hours


def update_working_hours(
    db: Session,
    owner_id: int,
    day_of_week: int,
    data: WorkingHoursUpdate,
) -> SalonWorkingHours:
    salon = get_owner_salon(db, owner_id)

    working_hours = db.scalar(
        select(SalonWorkingHours).where(
            SalonWorkingHours.salon_id == salon.id,
            SalonWorkingHours.day_of_week == day_of_week,
        )
    )

    if not working_hours:
        raise ValueError(
            "Working hours not found for this day"
        )

    working_hours.open_time = data.open_time
    working_hours.close_time = data.close_time
    working_hours.is_closed = data.is_closed

    db.commit()
    db.refresh(working_hours)

    return working_hours