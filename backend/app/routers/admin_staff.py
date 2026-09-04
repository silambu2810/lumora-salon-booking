from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.admin_staff import (
    AdminStaffResponse,
)
from app.services.admin_staff import (
    deactivate_staff,
    get_all_staff,
    get_staff,
)


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/admin/staff",
    tags=["Admin Staff"],
)


# =========================================================
# Get All Staff
# =========================================================

@router.get(
    "/",
    response_model=list[AdminStaffResponse],
    status_code=status.HTTP_200_OK,
)
def get_staff_members(
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=100,
    ),
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    return get_all_staff(
        db=db,
        skip=skip,
        limit=limit,
    )


# =========================================================
# Get Staff By ID
# =========================================================

@router.get(
    "/{staff_id}",
    response_model=AdminStaffResponse,
    status_code=status.HTTP_200_OK,
)
def get_staff_member(
    staff_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    if staff_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staff ID",
        )

    staff = get_staff(
        db=db,
        staff_id=staff_id,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    return staff


# =========================================================
# Deactivate Staff
# =========================================================

@router.put(
    "/{staff_id}/deactivate",
    response_model=AdminStaffResponse,
    status_code=status.HTTP_200_OK,
)
def deactivate_staff_member(
    staff_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    if staff_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staff ID",
        )

    staff = get_staff(
        db=db,
        staff_id=staff_id,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    try:
        return deactivate_staff(
            db=db,
            staff=staff,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error