from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order import OrderService

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    """
    POST /orders — Create a new order.
    Validates stock availability, deducts inventory, and calculates total amount.
    All operations happen within the session transaction — rolled back on any failure.
    """
    return await OrderService.create_order(db, order_in)


@router.get("", response_model=List[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db)):
    """GET /orders — Return all orders (newest first)."""
    return await OrderService.list_orders(db)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """GET /orders/{id} — Return order details by ID."""
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """DELETE /orders/{id} — Delete an order and restore inventory."""
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    await OrderService.delete(db, order)
    return None
