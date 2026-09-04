from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.dependencies.auth import require_roles
from app.models.user import User

from app.schemas.staff import StaffCreate, StaffResponse

from app.schemas.working_hours import (
    WorkingHoursCreate,
    WorkingHoursResponse,
    WorkingHoursUpdate,
)

from app.schemas.staff_leave import (
    StaffLeaveCreate,
    StaffLeaveResponse,
)

from app.services.working_hours import (
    create_working_hours,
    get_working_hours,
    update_working_hours,
)

from app.services.staff_leave import (
    create_staff_leave,
    get_staff_leaves,
)


router = APIRouter(
    prefix="/owner",
    tags=["Salon Owner"],
)


# =========================================================
# Create Staff
# =========================================================

@router.post(
    "/staff",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_staff(
    data: StaffCreate,
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Create a staff member for the authenticated salon owner's salon.

    The salon_id is NOT accepted from the request.
    It is always taken from current_user.salon_id.
    """

    # -----------------------------------------------------
    # 1. Make sure owner is assigned to a salon
    # -----------------------------------------------------

    if current_user.salon_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon owner is not assigned to a salon",
        )

    # -----------------------------------------------------
    # 2. Check duplicate email
    # -----------------------------------------------------

    existing_email = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # -----------------------------------------------------
    # 3. Check duplicate phone
    # -----------------------------------------------------

    existing_phone = db.scalar(
        select(User).where(
            User.phone == data.phone
        )
    )

    if existing_phone is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # -----------------------------------------------------
    # 4. Create staff
    # -----------------------------------------------------

    staff = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),

        # Staff role is controlled by backend.
        role="staff",

        # IMPORTANT:
        # Staff automatically belongs to the
        # authenticated owner's salon.
        salon_id=current_user.salon_id,

        # Owner-created staff do not need customer OTP
        # registration flow.
        is_email_verified=True,

        is_active=True,
    )

    db.add(staff)

    # -----------------------------------------------------
    # 5. Commit safely
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(staff)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone number is already registered",
        ) from error

    except Exception:
        db.rollback()
        raise

    return staff


# =========================================================
# Get Salon Working Hours
# =========================================================

@router.get(
    "/working-hours",
    response_model=list[WorkingHoursResponse],
)
def get_owner_working_hours(
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Get working hours for the authenticated owner's salon.
    """

    try:
        return get_working_hours(
            db=db,
            owner_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Create Salon Working Hours
# =========================================================

@router.post(
    "/working-hours",
    response_model=WorkingHoursResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_owner_working_hours(
    data: WorkingHoursCreate,
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Create working hours for the authenticated owner's salon.
    """

    try:
        return create_working_hours(
            db=db,
            owner_id=current_user.id,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Update Salon Working Hours
# =========================================================

@router.put(
    "/working-hours/{day_of_week}",
    response_model=WorkingHoursResponse,
)
def update_owner_working_hours(
    day_of_week: int,
    data: WorkingHoursUpdate,
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Update working hours for one day.

    0 = Monday
    1 = Tuesday
    2 = Wednesday
    3 = Thursday
    4 = Friday
    5 = Saturday
    6 = Sunday
    """

    # -----------------------------------------------------
    # Validate day of week
    # -----------------------------------------------------

    if day_of_week < 0 or day_of_week > 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_of_week must be between 0 and 6",
        )

    try:
        return update_working_hours(
            db=db,
            owner_id=current_user.id,
            day_of_week=day_of_week,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Create Staff Leave
# =========================================================

@router.post(
    "/staff/{staff_id}/leave",
    response_model=StaffLeaveResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_owner_staff_leave(
    staff_id: int,
    data: StaffLeaveCreate,
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Create leave for a staff member belonging
    to the authenticated owner's salon.
    """

    if staff_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staff ID",
        )

    try:
        return create_staff_leave(
            db=db,
            owner_id=current_user.id,
            staff_id=staff_id,
            data=data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Get Staff Leaves
# =========================================================

@router.get(
    "/staff/{staff_id}/leave",
    response_model=list[StaffLeaveResponse],
)
def get_owner_staff_leaves(
    staff_id: int,
    current_user: User = Depends(
        require_roles("salon_owner")
    ),
    db: Session = Depends(get_db),
):
    """
    Get leave records for a staff member belonging
    to the authenticated owner's salon.
    """

    if staff_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staff ID",
        )

    try:
        return get_staff_leaves(
            db=db,
            owner_id=current_user.id,
            staff_id=staff_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error