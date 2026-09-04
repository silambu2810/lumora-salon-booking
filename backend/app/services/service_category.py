from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.salon import Salon
from app.models.service_category import ServiceCategory
from app.models.user import User
from app.schemas.service_category import (
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
)


# =========================================================
# Validate Salon
# =========================================================

def _get_active_salon(
    db: Session,
    salon_id: int,
) -> Salon:

    salon = db.scalar(
        select(Salon).where(
            Salon.id == salon_id,
            Salon.is_active.is_(True),
        )
    )

    if salon is None:
        raise ValueError(
            "Salon not found or inactive"
        )

    return salon


# =========================================================
# Validate Create Access
# =========================================================

def validate_create_category_access(
    current_user: User,
    salon_id: int,
) -> None:

    if current_user.role == "admin":
        return

    if current_user.role != "salon_owner":
        raise ValueError(
            "You do not have permission to manage categories"
        )

    if current_user.salon_id != salon_id:
        raise ValueError(
            "You can only manage categories for your own salon"
        )


# =========================================================
# Validate Existing Category Access
# =========================================================

def validate_category_access(
    current_user: User,
    category: ServiceCategory,
) -> None:

    if current_user.role == "admin":
        return

    if current_user.role != "salon_owner":
        raise ValueError(
            "You do not have permission to manage categories"
        )

    if current_user.salon_id != category.salon_id:
        raise ValueError(
            "You can only manage categories for your own salon"
        )


# =========================================================
# Check Duplicate Category Name
# =========================================================

def _check_duplicate_category_name(
    db: Session,
    salon_id: int,
    name: str,
    exclude_category_id: int | None = None,
) -> None:

    query = select(ServiceCategory).where(
        ServiceCategory.salon_id == salon_id,
        ServiceCategory.name == name,
    )

    if exclude_category_id is not None:
        query = query.where(
            ServiceCategory.id != exclude_category_id
        )

    existing = db.scalar(query)

    if existing is not None:
        raise ValueError(
            "A category with this name already exists in this salon"
        )


# =========================================================
# Create Category
# =========================================================

def create_category(
    db: Session,
    category_data: ServiceCategoryCreate,
) -> ServiceCategory:

    _get_active_salon(
        db=db,
        salon_id=category_data.salon_id,
    )

    _check_duplicate_category_name(
        db=db,
        salon_id=category_data.salon_id,
        name=category_data.name,
    )

    category = ServiceCategory(
        name=category_data.name,
        description=category_data.description,
        salon_id=category_data.salon_id,
        is_active=True,
    )

    db.add(category)

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "Could not create service category"
        ) from error

    return category


# =========================================================
# Get All Categories
# =========================================================

def get_all_categories(
    db: Session,
    salon_id: int | None = None,
    active_only: bool = True,
) -> list[ServiceCategory]:

    query = select(ServiceCategory)

    if salon_id is not None:
        query = query.where(
            ServiceCategory.salon_id == salon_id
        )

    if active_only:
        query = query.where(
            ServiceCategory.is_active.is_(True)
        )

    query = query.order_by(
        ServiceCategory.id.asc()
    )

    return list(
        db.scalars(query).all()
    )


# =========================================================
# Get Single Category
# =========================================================

def get_category_by_id(
    db: Session,
    category_id: int,
) -> ServiceCategory | None:

    return db.scalar(
        select(ServiceCategory).where(
            ServiceCategory.id == category_id
        )
    )


# =========================================================
# Update Category
# =========================================================

def update_category(
    db: Session,
    category: ServiceCategory,
    category_data: ServiceCategoryUpdate,
) -> ServiceCategory:

    update_data = category_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        _check_duplicate_category_name(
            db=db,
            salon_id=category.salon_id,
            name=update_data["name"],
            exclude_category_id=category.id,
        )

    for field, value in update_data.items():
        setattr(category, field, value)

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError as error:
        db.rollback()
        raise ValueError(
            "Could not update service category"
        ) from error

    return category


# =========================================================
# Deactivate Category
# =========================================================

def deactivate_category(
    db: Session,
    category: ServiceCategory,
) -> ServiceCategory:

    if not category.is_active:
        raise ValueError(
            "Category is already inactive"
        )

    category.is_active = False

    try:
        db.commit()
        db.refresh(category)
    except Exception:
        db.rollback()
        raise

    return category