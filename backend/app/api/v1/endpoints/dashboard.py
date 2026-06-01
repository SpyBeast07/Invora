from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("", response_model=DashboardResponse)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    """
    GET /dashboard — Return aggregate metrics.
    Response: {total_products, total_customers, total_orders, low_stock_products}
    """
    return await DashboardService.get_metrics(db)
