from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.admin_customer import (
    AdminCustomerResponse,
    AdminCustomerUpdate,
)
from app.services.admin_customer import (
    deactivate_customer,
    get_all_customers,
    get_customer,
    update_customer,
)


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/admin/customers",
    tags=["Admin Customers"],
)


# =========================================================
# Get All Customers
# =========================================================

@router.get(
    "/",
    response_model=list[AdminCustomerResponse],
    status_code=status.HTTP_200_OK,
)
def get_customers_endpoint(
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
    return get_all_customers(
        db=db,
        skip=skip,
        limit=limit,
    )


# =========================================================
# Get Customer By ID
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=AdminCustomerResponse,
    status_code=status.HTTP_200_OK,
)
def get_customer_endpoint(
    customer_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    customer = get_customer(
        db=db,
        customer_id=customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    return customer


# =========================================================
# Update Customer
# =========================================================

@router.put(
    "/{customer_id}",
    response_model=AdminCustomerResponse,
    status_code=status.HTTP_200_OK,
)
def update_customer_endpoint(
    customer_id: int,
    customer_data: AdminCustomerUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    customer = get_customer(
        db=db,
        customer_id=customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    try:
        return update_customer(
            db=db,
            customer=customer,
            customer_data=customer_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


# =========================================================
# Deactivate Customer
# =========================================================

@router.put(
    "/{customer_id}/deactivate",
    response_model=AdminCustomerResponse,
    status_code=status.HTTP_200_OK,
)
def deactivate_customer_endpoint(
    customer_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    customer = get_customer(
        db=db,
        customer_id=customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    try:
        return deactivate_customer(
            db=db,
            customer=customer,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error