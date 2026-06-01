from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, condecimal


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=100, description="Unique Stock Keeping Unit code")
    name: str = Field(..., min_length=1, max_length=255, description="Product display name")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed product description")
    category: Optional[str] = Field(None, max_length=100, description="Product category for grouping")
    price: condecimal(max_digits=10, decimal_places=2, ge=0) = Field(..., description="Unit sale price")
    is_active: bool = Field(True, description="Whether the product is currently active")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=3, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[condecimal(max_digits=10, decimal_places=2, ge=0)] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        # Allow Decimal serialization in JSON responses
        json_encoders = {
            condecimal: lambda v: float(v)
        }
