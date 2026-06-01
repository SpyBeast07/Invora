from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field

from app.schemas.customer import CustomerResponse


# ------------------------------------------------------------------------------
# Order Item Schemas
# ------------------------------------------------------------------------------

class OrderItemBase(BaseModel):
    product_id: int = Field(..., description="ID of the purchased product")
    quantity: int = Field(..., ge=1, description="Quantity of items purchased")


class OrderItemCreate(OrderItemBase):
    """Client payload for adding items to a new order. Price is fetched server-side."""
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    unit_price: Annotated[Decimal, Field(max_digits=10, decimal_places=2, description="Frozen historical unit price")]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# Order Schemas
# ------------------------------------------------------------------------------

class OrderBase(BaseModel):
    customer_id: int = Field(..., description="Foreign key ID of the associated Customer")


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items for this order")


class OrderUpdate(BaseModel):
    status: str = Field(..., description="Updated order status: pending, paid, shipped, cancelled")


class OrderResponse(OrderBase):
    id: int
    order_number: str
    status: str
    total_amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    user_id: Optional[int]
    items: List[OrderItemResponse]
    customer: Optional[CustomerResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
