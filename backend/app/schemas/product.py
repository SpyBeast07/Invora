from datetime import datetime
from decimal import Decimal
from typing import Annotated, Optional
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100, description="Unique Stock Keeping Unit code")
    name: str = Field(..., min_length=1, max_length=255, description="Product display name")
    price: Annotated[Decimal, Field(max_digits=10, decimal_places=2, gt=0, description="Unit sale price (must be > 0)")]
    quantity_in_stock: int = Field(0, ge=0, description="Current stock count (must be >= 0)")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """All fields optional for partial updates."""
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2, gt=0)]] = None
    quantity_in_stock: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}
