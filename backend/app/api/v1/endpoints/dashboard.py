from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("", response_model=DashboardResponse)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Fetch aggregate analytics metrics for products, customers, transactions, and alerts.
    Utilizes a single highly-optimized database round-trip query.
    Requires active user authentication.
    """
    return await DashboardService.get_metrics(db)
