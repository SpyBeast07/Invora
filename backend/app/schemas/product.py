from datetime import datetime
from decimal import Decimal
from typing import Optional, Annotated
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=100, description="Unique Stock Keeping Unit code")
    name: str = Field(..., min_length=1, max_length=255, description="Product display name")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed product description")
    category: Optional[str] = Field(None, max_length=100, description="Product category for grouping")
    price: Annotated[Decimal, Field(max_digits=10, decimal_places=2, gt=0, description="Unit sale price")]
    quantity_in_stock: int = Field(0, ge=0, description="Current physical count of items in stock")
    is_active: bool = Field(True, description="Whether the product is currently active")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=3, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2, gt=0)]] = None
    quantity_in_stock: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
