from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api import deps
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.services.order import OrderService

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Process and record a new sales order.
    Deducts stock from inventory dynamically.
    Attributes the transaction to the authenticated user.
    """
    return await OrderService.create_order(db, order_in, user_id=current_user.id)


@router.get("", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter orders by status"),
    search: Optional[str] = Query(None, description="Search by Order Number or Customer Name"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    List sales transactions with pagination and optional filters.
    Requires active user authentication.
    """
    skip = (page - 1) * size
    orders, total = await OrderService.list_orders(
        db, skip=skip, limit=size, status_filter=status, search=search
    )
    
    pages = (total + size - 1) // size
    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch complete order details and frozen pricing details by ID."""
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return order


@router.get("/number/{order_number}", response_model=OrderResponse)
async def get_order_by_number(
    order_number: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch complete order details and frozen pricing details by Order Number code."""
    order = await OrderService.get_by_number(db, order_number)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with code '{order_number}' not found."
        )
    return order


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager"]))],
)
async def update_order_status(
    order_id: int,
    update_in: OrderUpdate,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Update the fulfillment status of an order.
    Restoring stock values dynamically on cancellation.
    Restricted to Admin and Manager roles.
    """
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return await OrderService.update_status(db, order, update_in)
