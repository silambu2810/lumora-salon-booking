from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.salon import Salon
from app.models.service import Service
from app.models.user import User
from app.schemas.salon import (
    SalonCreate,
    SalonResponse,
    SalonUpdate,
)
from app.schemas.service import ServiceResponse
from app.schemas.staff import StaffResponse
from app.services.salon import (
    create_salon,
    delete_salon,
    update_salon,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/salons",
    tags=["Salons"],
)


# =========================================================
# CREATE SALON
# =========================================================
# ADMIN ONLY
# =========================================================

@router.post(
    "/",
    response_model=SalonResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_salon_endpoint(
    salon_data: SalonCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Create a new salon.

    Only administrators can create salons.
    """

    try:
        return create_salon(
            db=db,
            salon_data=salon_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# GET ALL ACTIVE SALONS
# =========================================================
# PUBLIC
# =========================================================

@router.get(
    "/",
    response_model=list[SalonResponse],
    status_code=status.HTTP_200_OK,
)
def get_all_salons(
    skip: int = Query(
        default=0,
        ge=0,
        description="Number of salons to skip",
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=100,
        description="Maximum number of salons to return",
    ),
    db: Session = Depends(get_db),
):
    """
    Return only ACTIVE salons.

    This endpoint is intentionally public because
    customers use it for salon discovery.

    Inactive salons are never exposed here.
    """

    salons = db.scalars(
        select(Salon)
        .where(
            Salon.is_active.is_(True)
        )
        .order_by(
            Salon.id.asc()
        )
        .offset(skip)
        .limit(limit)
    ).all()

    return list(salons)


# =========================================================
# GET ALL SALONS FOR ADMIN
# =========================================================
# ADMIN ONLY
# =========================================================

@router.get(
    "/admin/all",
    response_model=list[SalonResponse],
    status_code=status.HTTP_200_OK,
)
def get_all_salons_for_admin(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return ALL salons for administrator management.

    Unlike GET /salons/, this includes:

        - active salons
        - inactive salons

    This allows administrators to reactivate
    previously deactivated salons.
    """

    salons = db.scalars(
        select(Salon)
        .order_by(
            Salon.id.asc()
        )
    ).all()

    return list(salons)


# =========================================================
# GET ACTIVE SALON BY ID
# =========================================================
# PUBLIC
# =========================================================

@router.get(
    "/{salon_id}",
    response_model=SalonResponse,
    status_code=status.HTTP_200_OK,
)
def get_single_salon(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """
    Return an active salon by ID.

    Inactive salons are treated as unavailable
    to customers.
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id,
            Salon.is_active.is_(True),
        )
    )

    if salon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    return salon


# =========================================================
# GET ACTIVE SERVICES FOR SALON
# =========================================================
# PUBLIC
# =========================================================

@router.get(
    "/{salon_id}/services",
    response_model=list[ServiceResponse],
    status_code=status.HTTP_200_OK,
)
def get_salon_services(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """
    Return active services belonging to an active salon.
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id,
            Salon.is_active.is_(True),
        )
    )

    if salon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    services = db.scalars(
        select(Service)
        .where(
            Service.salon_id == salon_id,
            Service.is_active.is_(True),
        )
        .order_by(
            Service.id.asc()
        )
    ).all()

    return list(services)


# =========================================================
# GET ACTIVE STAFF FOR SALON
# =========================================================
# PUBLIC
# =========================================================

@router.get(
    "/{salon_id}/staff",
    response_model=list[StaffResponse],
    status_code=status.HTTP_200_OK,
)
def get_salon_staff(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """
    Return active staff members belonging to
    an active salon.

    Only users with role='staff' are returned.
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id,
            Salon.is_active.is_(True),
        )
    )

    if salon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    staff = db.scalars(
        select(User)
        .where(
            User.salon_id == salon_id,
            User.role == "staff",
            User.is_active.is_(True),
        )
        .order_by(
            User.id.asc()
        )
    ).all()

    return list(staff)


# =========================================================
# UPDATE SALON
# =========================================================
# ADMIN ONLY
# =========================================================

@router.put(
    "/{salon_id}",
    response_model=SalonResponse,
    status_code=status.HTTP_200_OK,
)
def update_single_salon(
    salon_id: int,
    salon_data: SalonUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Update a salon.

    Admins can update:

        - name
        - address
        - phone
        - email
        - description
        - is_active

    Sending:

        {
            "is_active": true
        }

    reactivates the salon.

    Sending:

        {
            "is_active": false
        }

    deactivates the salon.
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id
        )
    )

    if salon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    try:
        return update_salon(
            db=db,
            salon=salon,
            salon_data=salon_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# DEACTIVATE SALON
# =========================================================
# ADMIN ONLY
# =========================================================

@router.delete(
    "/{salon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_single_salon(
    salon_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Soft-deactivate a salon.

    IMPORTANT:

    This does NOT physically delete the salon.

    The salon is changed to:

        is_active = false

    Historical data remains intact, including:

        - appointments
        - reviews
        - services
        - working hours
        - staff
        - owner relationship
    """

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id
        )
    )

    if salon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon not found",
        )

    if not salon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon is already inactive",
        )

    try:
        delete_salon(
            db=db,
            salon=salon,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return None