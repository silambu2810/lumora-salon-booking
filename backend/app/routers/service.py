from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.service import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate,
)
from app.services.service import (
    create_service,
    deactivate_service,
    get_all_services,
    get_service_by_id,
    update_service,
    validate_create_service_access,
    validate_service_salon_access,
)

router = APIRouter(
    prefix="/services",
    tags=["Services"],
)


# =========================================================
# Create Service
# =========================================================

@router.post(
    "/",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_service_endpoint(
    service_data: ServiceCreate,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    try:
        validate_create_service_access(
            current_user=current_user,
            salon_id=service_data.salon_id,
        )

        return create_service(
            db=db,
            service_data=service_data,
        )

    except ValueError as error:
        message = str(error)

        if (
            "permission" in message.lower()
            or "own salon" in message.lower()
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            ) from error

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from error


# =========================================================
# Get Services
# =========================================================

@router.get(
    "/",
    response_model=list[ServiceResponse],
)
def get_services(
    salon_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    return get_all_services(
        db=db,
        salon_id=salon_id,
        active_only=True,
    )


# =========================================================
# Get Single Service
# =========================================================

@router.get(
    "/{service_id}",
    response_model=ServiceResponse,
)
def get_single_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    if service_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID",
        )

    service = get_service_by_id(
        db=db,
        service_id=service_id,
    )

    if service is None or not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    return service


# =========================================================
# Update Service
# =========================================================

@router.put(
    "/{service_id}",
    response_model=ServiceResponse,
)
def update_single_service(
    service_id: int,
    service_data: ServiceUpdate,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    if service_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID",
        )

    service = get_service_by_id(
        db=db,
        service_id=service_id,
    )

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # -----------------------------------------------------
    # Check salon ownership
    # -----------------------------------------------------

    try:
        validate_service_salon_access(
            current_user=current_user,
            service=service,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # Update service
    # -----------------------------------------------------

    try:
        return update_service(
            db=db,
            service=service,
            service_data=service_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Deactivate Service
# =========================================================

@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_single_service(
    service_id: int,
    current_user: User = Depends(
        require_roles("admin", "salon_owner")
    ),
    db: Session = Depends(get_db),
):
    if service_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID",
        )

    service = get_service_by_id(
        db=db,
        service_id=service_id,
    )

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # -----------------------------------------------------
    # Check salon ownership
    # -----------------------------------------------------

    try:
        validate_service_salon_access(
            current_user=current_user,
            service=service,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # Soft delete / deactivate
    # -----------------------------------------------------

    try:
        deactivate_service(
            db=db,
            service=service,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return None