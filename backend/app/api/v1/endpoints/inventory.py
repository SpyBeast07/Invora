from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.inventory import InventoryAdjustment, InventoryResponse, InventoryUpdate
from app.services.inventory import InventoryService

router = APIRouter()


@router.get("/low-stock", response_model=PaginatedResponse[InventoryResponse])
async def list_low_stock(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    List all low-stock inventory records where quantity falls below reorder thresholds.
    Requires active user authentication.
    """
    skip = (page - 1) * size
    records, total = await InventoryService.get_low_stock_alerts(db, skip=skip, limit=size)
    
    pages = (total + size - 1) // size
    return PaginatedResponse(
        items=records,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{product_id}", response_model=InventoryResponse)
async def get_inventory_by_product_id(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch current inventory level and configuration for a product."""
    return await InventoryService.get_by_product_id(db, product_id)


@router.post(
    "/{product_id}/adjust",
    response_model=InventoryResponse,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager", "operator"]))],
)
async def adjust_inventory_stock(
    product_id: int,
    adjustment: InventoryAdjustment,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Perform transactional stock adjustment (adding or subtracting items).
    Available for all roles (including operator warehouse staff).
    Prevents negative stock calculations.
    """
    return await InventoryService.adjust_stock_level(db, product_id, adjustment)


@router.put(
    "/{product_id}/settings",
    response_model=InventoryResponse,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager"]))],
)
async def update_inventory_settings(
    product_id: int,
    settings_in: InventoryUpdate,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Update inventory parameters like warehouse bin location and reorder level.
    Restricted to Admin and Manager roles.
    """
    return await InventoryService.update_settings(db, product_id, settings_in)
