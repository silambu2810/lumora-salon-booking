from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service import Service
from app.models.service_category import ServiceCategory
from app.models.salon import Salon
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate


# =========================================================
# Category Validation
# =========================================================

def validate_service_category(
    db: Session,
    salon_id: int,
    category_id: int | None,
) -> None:
    """
    Validate that the selected category:

    1. Exists
    2. Is active
    3. Belongs to the same salon as the service
    """

    # No category is also valid because category_id is optional.
    if category_id is None:
        return

    category = db.scalar(
        select(ServiceCategory).where(
            ServiceCategory.id == category_id,
            ServiceCategory.salon_id == salon_id,
            ServiceCategory.is_active.is_(True),
        )
    )

    if category is None:
        raise ValueError(
            "Category not found, inactive, or does not belong to this salon"
        )


# =========================================================
# Create Service
# =========================================================

def create_service(
    db: Session,
    service_data: ServiceCreate,
) -> Service:
    """
    Create a new service for an active salon.

    If category_id is provided, the category must:
    - exist
    - be active
    - belong to the same salon
    """

    salon = db.scalar(
        select(Salon).where(
            Salon.id == service_data.salon_id,
            Salon.is_active.is_(True),
        )
    )

    if salon is None:
        raise ValueError(
            "Salon not found or inactive"
        )

    validate_service_category(
        db=db,
        salon_id=service_data.salon_id,
        category_id=service_data.category_id,
    )

    service = Service(
        name=service_data.name,
        description=service_data.description,
        price=service_data.price,
        duration_minutes=service_data.duration_minutes,
        salon_id=service_data.salon_id,
        category_id=service_data.category_id,
        is_active=True,
    )

    db.add(service)

    try:
        db.commit()
        db.refresh(service)
    except Exception:
        db.rollback()
        raise

    return service


# =========================================================
# Get All Services
# =========================================================

def get_all_services(
    db: Session,
    salon_id: int | None = None,
    active_only: bool = False,
) -> list[Service]:
    """
    Get services.

    salon_id:
        Optional salon filter.

    active_only:
        If True, return only active services.
    """

    query = select(Service)

    if salon_id is not None:
        query = query.where(
            Service.salon_id == salon_id
        )

    if active_only:
        query = query.where(
            Service.is_active.is_(True)
        )

    query = query.order_by(
        Service.id.asc()
    )

    return list(
        db.scalars(query).all()
    )


# =========================================================
# Get Service By ID
# =========================================================

def get_service_by_id(
    db: Session,
    service_id: int,
) -> Service | None:
    """
    Return a service by ID.

    This intentionally does not filter by is_active because
    admin/owner operations may need to access inactive services.
    """

    return db.scalar(
        select(Service).where(
            Service.id == service_id
        )
    )


# =========================================================
# Update Service
# =========================================================

def update_service(
    db: Session,
    service: Service,
    service_data: ServiceUpdate,
) -> Service:
    """
    Update an existing service.

    If category_id is being changed, validate that the new
    category belongs to the same salon and is active.

    Explicitly setting category_id to null is allowed and
    removes the category assignment.
    """

    update_data = service_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Validate category if category_id is being changed
    # -----------------------------------------------------

    if "category_id" in update_data:

        category_id = update_data["category_id"]

        validate_service_category(
            db=db,
            salon_id=service.salon_id,
            category_id=category_id,
        )

    # -----------------------------------------------------
    # Apply updates
    # -----------------------------------------------------

    for field, value in update_data.items():
        setattr(service, field, value)

    try:
        db.commit()
        db.refresh(service)
    except Exception:
        db.rollback()
        raise

    return service


# =========================================================
# Deactivate Service
# =========================================================

def deactivate_service(
    db: Session,
    service: Service,
) -> Service:
    """
    Soft-delete a service by marking it inactive.

    The database record is preserved so existing appointments
    can continue referencing the service.
    """

    if not service.is_active:
        raise ValueError(
            "Service is already inactive"
        )

    service.is_active = False

    try:
        db.commit()
        db.refresh(service)
    except Exception:
        db.rollback()
        raise

    return service


# =========================================================
# Service Access Validation
# =========================================================

def validate_service_salon_access(
    current_user: User,
    service: Service,
) -> None:
    """
    Validate whether a user can manage a specific service.

    Admin:
        Can manage services for any salon.

    Salon Owner:
        Can manage services only for their own salon.

    Everyone else:
        Cannot manage services.
    """

    if current_user.role == "admin":
        return

    if current_user.role != "salon_owner":
        raise ValueError(
            "You do not have permission to manage services"
        )

    if current_user.salon_id != service.salon_id:
        raise ValueError(
            "You can only manage services for your own salon"
        )


# =========================================================
# Create Service Access Validation
# =========================================================

def validate_create_service_access(
    current_user: User,
    salon_id: int,
) -> None:
    """
    Validate whether a user can create a service for a salon.

    Admin:
        Can create services for any salon.

    Salon Owner:
        Can create services only for their own salon.

    Everyone else:
        Cannot create services.
    """

    if current_user.role == "admin":
        return

    if current_user.role != "salon_owner":
        raise ValueError(
            "You do not have permission to manage services"
        )

    if current_user.salon_id != salon_id:
        raise ValueError(
            "You can only create services for your own salon"
        )