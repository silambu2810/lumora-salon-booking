from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.dependencies.auth import require_roles
from app.models.salon import Salon
from app.models.user import User
from app.schemas.auth import (
    AdminCreateUserRequest,
    AssignSalonOwnerRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# =========================================================
# GET ALL SALON OWNERS
# =========================================================

@router.get(
    "/salon-owners",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
)
def get_salon_owners(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Return ALL salon owners.

    Admin needs to see both active and inactive owners
    so that inactive accounts can be managed/reactivated.
    """

    owners = db.scalars(
        select(User)
        .where(
            User.role == "salon_owner"
        )
        .order_by(
            User.id.asc()
        )
    ).all()

    return list(owners)


# =========================================================
# CREATE SALON OWNER
# =========================================================

@router.post(
    "/salon-owners",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_salon_owner(
    data: AdminCreateUserRequest,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Create a new salon owner account.

    The role is always set by the backend:
        salon_owner

    Email and phone must be unique.
    """

    # -----------------------------------------------------
    # Check duplicate email
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
    # Check duplicate phone
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
    # Create owner
    # -----------------------------------------------------

    owner = User(
        name=data.name.strip(),
        email=data.email,
        phone=data.phone.strip(),
        password_hash=hash_password(
            data.password
        ),
        role="salon_owner",
        is_email_verified=True,
        is_active=True,
        salon_id=None,
    )

    db.add(owner)

    try:
        db.commit()
        db.refresh(owner)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone number is already registered",
        ) from error

    return owner


# =========================================================
# DEACTIVATE SALON OWNER
# =========================================================

@router.put(
    "/salon-owners/{owner_id}/deactivate",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def deactivate_salon_owner(
    owner_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Deactivate a salon owner.

    IMPORTANT:
    The owner is NOT deleted.

    We only change:

        is_active = False

    Existing salon assignment and historical data
    remain in the database.
    """

    # -----------------------------------------------------
    # Validate ID
    # -----------------------------------------------------

    if owner_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid owner ID",
        )

    # -----------------------------------------------------
    # Find owner
    # -----------------------------------------------------

    owner = db.scalar(
        select(User).where(
            User.id == owner_id,
            User.role == "salon_owner",
        )
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon owner not found",
        )

    # -----------------------------------------------------
    # Already inactive
    # -----------------------------------------------------

    if not owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon owner is already inactive",
        )

    # -----------------------------------------------------
    # Deactivate
    # -----------------------------------------------------

    owner.is_active = False

    try:
        db.commit()
        db.refresh(owner)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to deactivate salon owner",
        ) from error

    return owner


# =========================================================
# REACTIVATE SALON OWNER
# =========================================================

@router.put(
    "/salon-owners/{owner_id}/activate",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def activate_salon_owner(
    owner_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Reactivate a previously deactivated salon owner.
    """

    # -----------------------------------------------------
    # Validate ID
    # -----------------------------------------------------

    if owner_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid owner ID",
        )

    # -----------------------------------------------------
    # Find owner
    # -----------------------------------------------------

    owner = db.scalar(
        select(User).where(
            User.id == owner_id,
            User.role == "salon_owner",
        )
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon owner not found",
        )

    # -----------------------------------------------------
    # Already active
    # -----------------------------------------------------

    if owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon owner is already active",
        )

    # -----------------------------------------------------
    # Reactivate
    # -----------------------------------------------------

    owner.is_active = True

    try:
        db.commit()
        db.refresh(owner)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to reactivate salon owner",
        ) from error

    return owner


# =========================================================
# ASSIGN SALON OWNER
# =========================================================

@router.put(
    "/salons/{salon_id}/owner",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def assign_salon_owner(
    salon_id: int,
    data: AssignSalonOwnerRequest,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Assign an active salon owner to a salon.

    Rules:

    1. Salon must exist.
    2. Owner must exist.
    3. Owner must have role='salon_owner'.
    4. Owner must be active.
    5. Salon cannot already have another owner.
    6. Owner cannot already belong to another salon.
    7. Both sides of the relationship are synchronized.
    """

    # -----------------------------------------------------
    # Validate salon ID
    # -----------------------------------------------------

    if salon_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid salon ID",
        )

    # -----------------------------------------------------
    # Find salon
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Find owner
    # -----------------------------------------------------

    owner = db.scalar(
        select(User).where(
            User.id == data.owner_id
        )
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salon owner not found",
        )

    # -----------------------------------------------------
    # Verify role
    # -----------------------------------------------------

    if owner.role != "salon_owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a salon owner",
        )

    # -----------------------------------------------------
    # Verify owner is active
    # -----------------------------------------------------

    if not owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon owner account is inactive",
        )

    # -----------------------------------------------------
    # Check existing salon owner
    # -----------------------------------------------------

    if (
        salon.owner_id is not None
        and salon.owner_id != owner.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon already has an owner",
        )

    # -----------------------------------------------------
    # Check owner assignment
    # -----------------------------------------------------

    if (
        owner.salon_id is not None
        and owner.salon_id != salon.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salon owner is already assigned to another salon",
        )

    # -----------------------------------------------------
    # Assign owner
    # -----------------------------------------------------

    salon.owner_id = owner.id
    owner.salon_id = salon.id

    try:
        db.commit()
        db.refresh(owner)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to assign salon owner",
        ) from error

    return owner