from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InventoryBase(BaseModel):
    product_id: int = Field(..., description="Foreign key ID of the associated product")
    quantity: int = Field(0, ge=0, description="Current stock count of the item")
    location: Optional[str] = Field(None, max_length=255, description="Physical warehouse bin location")
    reorder_level: int = Field(5, ge=0, description="Minimum quantity before triggering a reorder alert")


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    location: Optional[str] = Field(None, max_length=255)
    reorder_level: Optional[int] = Field(None, ge=0)


class InventoryAdjustment(BaseModel):
    quantity_change: int = Field(..., description="Quantity delta to add/subtract. Positives increase, negatives decrease stock.")


class InventoryResponse(InventoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
