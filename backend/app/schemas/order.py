from datetime import datetime
from decimal import Decimal
from typing import List, Annotated, Optional
from pydantic import BaseModel, Field

from app.schemas.customer import CustomerResponse


# ------------------------------------------------------------------------------
# Order Item Schemas
# ------------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of the product being ordered")
    quantity: int = Field(..., ge=1, description="Number of units (must be >= 1)")


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Annotated[Decimal, Field(max_digits=10, decimal_places=2, description="Price snapshot at time of order")]

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}


# ------------------------------------------------------------------------------
# Order Schemas
# ------------------------------------------------------------------------------

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items (at least 1 required)")


class OrderResponse(BaseModel):
    """
    Response schema exposing spec-required fields:
    id, customer_id, total_amount, created_at.
    Also includes items and customer for detail views.
    """
    id: int
    customer_id: int
    total_amount: Annotated[Decimal, Field(max_digits=12, decimal_places=2)]
    created_at: datetime
    items: List[OrderItemResponse]
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}
