from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.salon import Salon
from app.models.user import User
from app.schemas.salon import SalonCreate, SalonUpdate


# =========================================================
# Create Salon
# =========================================================

def create_salon(
    db: Session,
    salon_data: SalonCreate,
) -> Salon:
    """
    Create a new salon.

    If an owner is supplied:
    - Owner must exist.
    - Owner must have role='salon_owner'.
    - Owner must be active.
    - Owner must not already own another salon.

    After creation, the owner's salon_id is synchronized
    with the newly created salon.
    """

    owner = None

    # -----------------------------------------------------
    # Validate owner
    # -----------------------------------------------------

    if salon_data.owner_id is not None:

        owner = db.scalar(
            select(User).where(
                User.id == salon_data.owner_id,
                User.role == "salon_owner",
                User.is_active.is_(True),
            )
        )

        if owner is None:
            raise ValueError(
                "Salon owner not found or is not an active salon owner"
            )

        # -------------------------------------------------
        # Prevent one owner from owning multiple salons
        # -------------------------------------------------

        existing_salon = db.scalar(
            select(Salon).where(
                Salon.owner_id == owner.id
            )
        )

        if existing_salon is not None:
            raise ValueError(
                "This salon owner is already assigned to a salon"
            )

    # -----------------------------------------------------
    # Create salon
    # -----------------------------------------------------

    salon = Salon(
        name=salon_data.name,
        address=salon_data.address,
        phone=salon_data.phone,
        email=salon_data.email,
        description=salon_data.description,
        owner_id=salon_data.owner_id,
        is_active=True,
    )

    db.add(salon)

    try:
        db.flush()

        # -------------------------------------------------
        # Synchronize owner.salon_id
        # -------------------------------------------------

        if owner is not None:
            owner.salon_id = salon.id

        db.commit()
        db.refresh(salon)

    except Exception:
        db.rollback()
        raise

    return salon


# =========================================================
# Get All Salons
# =========================================================

def get_salons(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Salon]:
    """
    Return all salons with pagination.

    This function does not filter active/inactive salons.
    The router decides whether the request is public or admin.
    """

    statement = (
        select(Salon)
        .order_by(
            Salon.id.asc()
        )
        .offset(skip)
        .limit(limit)
    )

    result = db.execute(statement)

    return list(
        result.scalars().all()
    )


# =========================================================
# Get Salon By ID
# =========================================================

def get_salon_by_id(
    db: Session,
    salon_id: int,
) -> Salon | None:
    """
    Return a salon by ID.

    This is a general database lookup and therefore does
    not filter inactive salons.
    """

    return db.get(
        Salon,
        salon_id,
    )


# =========================================================
# Update Salon
# =========================================================

def update_salon(
    db: Session,
    salon: Salon,
    salon_data: SalonUpdate,
) -> Salon:
    """
    Update salon information.

    Owner assignment rules:
    - owner_id=None removes the current owner.
    - A new owner must be an active salon_owner.
    - An owner cannot be assigned to another salon.
    - The old owner's salon_id is cleared.
    - The new owner's salon_id is synchronized.

    Admins can also reactivate an inactive salon by sending:
        is_active=True
    """

    # -----------------------------------------------------
    # Get only fields explicitly supplied by client
    # -----------------------------------------------------

    update_data = salon_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Handle owner assignment
    # -----------------------------------------------------

    if "owner_id" in update_data:

        new_owner_id = update_data["owner_id"]

        # =================================================
        # CASE 1: Remove current owner
        # =================================================

        if new_owner_id is None:

            if salon.owner_id is not None:

                old_owner = db.get(
                    User,
                    salon.owner_id,
                )

                if old_owner is not None:

                    if old_owner.salon_id == salon.id:
                        old_owner.salon_id = None

        # =================================================
        # CASE 2: Same owner
        # =================================================

        elif new_owner_id == salon.owner_id:

            current_owner = db.scalar(
                select(User).where(
                    User.id == new_owner_id,
                    User.role == "salon_owner",
                    User.is_active.is_(True),
                )
            )

            if current_owner is None:
                raise ValueError(
                    "Salon owner not found or is not an active salon owner"
                )

            current_owner.salon_id = salon.id

        # =================================================
        # CASE 3: Assign a different owner
        # =================================================

        else:

            # -------------------------------------------------
            # Validate new owner
            # -------------------------------------------------

            new_owner = db.scalar(
                select(User).where(
                    User.id == new_owner_id,
                    User.role == "salon_owner",
                    User.is_active.is_(True),
                )
            )

            if new_owner is None:
                raise ValueError(
                    "Salon owner not found or is not an active salon owner"
                )

            # -------------------------------------------------
            # Check if new owner already owns another salon
            # -------------------------------------------------

            existing_salon = db.scalar(
                select(Salon).where(
                    Salon.owner_id == new_owner.id,
                    Salon.id != salon.id,
                )
            )

            if existing_salon is not None:
                raise ValueError(
                    "This salon owner is already assigned to another salon"
                )

            # -------------------------------------------------
            # Clear old owner's salon assignment
            # -------------------------------------------------

            if salon.owner_id is not None:

                old_owner = db.get(
                    User,
                    salon.owner_id,
                )

                if old_owner is not None:

                    if old_owner.salon_id == salon.id:
                        old_owner.salon_id = None

            # -------------------------------------------------
            # Assign new owner
            # -------------------------------------------------

            new_owner.salon_id = salon.id

    # -----------------------------------------------------
    # Update salon fields
    # -----------------------------------------------------

    for field, value in update_data.items():

        setattr(
            salon,
            field,
            value,
        )

    # -----------------------------------------------------
    # Save atomically
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(salon)

    except Exception:

        db.rollback()

        raise

    return salon


# =========================================================
# Deactivate Salon
# =========================================================

def delete_salon(
    db: Session,
    salon: Salon,
) -> None:
    """
    Deactivate a salon instead of physically deleting it.

    IMPORTANT:
    We intentionally DO NOT call db.delete(salon).

    Existing:
    - appointments
    - reviews
    - services
    - service categories
    - working hours
    - staff relationships

    remain in the database.

    The salon simply becomes unavailable for
    customer discovery and booking.

    The salon owner relationship is preserved so
    historical ownership information is not lost.
    """

    # -----------------------------------------------------
    # Already inactive
    # -----------------------------------------------------

    if not salon.is_active:

        raise ValueError(
            "Salon is already inactive"
        )

    # -----------------------------------------------------
    # Deactivate salon
    # -----------------------------------------------------

    salon.is_active = False

    # -----------------------------------------------------
    # DO NOT:
    #
    # db.delete(salon)
    #
    # DO NOT clear owner_id.
    #
    # DO NOT delete services.
    #
    # DO NOT delete appointments.
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(salon)

    except Exception:

        db.rollback()

        raise