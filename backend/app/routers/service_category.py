from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.service_category import (
    ServiceCategoryCreate,
    ServiceCategoryResponse,
    ServiceCategoryUpdate,
)
from app.services.service_category import (
    create_category,
    deactivate_category,
    get_all_categories,
    get_category_by_id,
    update_category,
    validate_category_access,
    validate_create_category_access,
)


router = APIRouter(
    prefix="/service-categories",
    tags=["Service Categories"],
)


# =========================================================
# Create Category
# =========================================================

@router.post(
    "/",
    response_model=ServiceCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category_endpoint(
    category_data: ServiceCategoryCreate,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    try:
        validate_create_category_access(
            current_user=current_user,
            salon_id=category_data.salon_id,
        )

        return create_category(
            db=db,
            category_data=category_data,
        )

    except ValueError as error:
        message = str(error)

        if "permission" in message.lower() or "own salon" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            ) from error

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from error


# =========================================================
# Get All Categories
# =========================================================

@router.get(
    "/",
    response_model=list[ServiceCategoryResponse],
)
def get_categories(
    salon_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    return get_all_categories(
        db=db,
        salon_id=salon_id,
        active_only=True,
    )


# =========================================================
# Get Single Category
# =========================================================

@router.get(
    "/{category_id}",
    response_model=ServiceCategoryResponse,
)
def get_single_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    if category_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID",
        )

    category = get_category_by_id(
        db=db,
        category_id=category_id,
    )

    if category is None or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service category not found",
        )

    return category


# =========================================================
# Update Category
# =========================================================

@router.put(
    "/{category_id}",
    response_model=ServiceCategoryResponse,
)
def update_single_category(
    category_id: int,
    category_data: ServiceCategoryUpdate,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    if category_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID",
        )

    category = get_category_by_id(
        db=db,
        category_id=category_id,
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service category not found",
        )

    try:
        validate_category_access(
            current_user=current_user,
            category=category,
        )

        return update_category(
            db=db,
            category=category,
            category_data=category_data,
        )

    except ValueError as error:
        message = str(error)

        if "permission" in message.lower() or "own salon" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            ) from error

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from error


# =========================================================
# Deactivate Category
# =========================================================

@router.put(
    "/{category_id}/deactivate",
    response_model=ServiceCategoryResponse,
)
def deactivate_single_category(
    category_id: int,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    if category_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID",
        )

    category = get_category_by_id(
        db=db,
        category_id=category_id,
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service category not found",
        )

    try:
        validate_category_access(
            current_user=current_user,
            category=category,
        )

        return deactivate_category(
            db=db,
            category=category,
        )

    except ValueError as error:
        message = str(error)

        if "permission" in message.lower() or "own salon" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            ) from error

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from error