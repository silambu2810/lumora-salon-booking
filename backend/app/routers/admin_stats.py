from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.admin_stats import AdminStatsResponse
from app.services.admin_stats import get_admin_stats


router = APIRouter(
    prefix="/admin/stats",
    tags=["Admin Statistics"],
)


# =========================================================
# ADMIN DASHBOARD STATISTICS
# =========================================================
@router.get(
    "/",
    response_model=AdminStatsResponse,
    status_code=status.HTTP_200_OK,
)
def get_admin_stats_endpoint(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """
    Return statistics for the admin dashboard.

    Only administrators can access this endpoint.
    """

    return get_admin_stats(db=db)