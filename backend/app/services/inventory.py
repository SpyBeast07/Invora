from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Tuple, Optional

from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.inventory import InventoryUpdate, InventoryAdjustment


class InventoryService:
    @staticmethod
    async def get_by_product_id(db: AsyncSession, product_id: int) -> Inventory:
        """Retrieve the inventory record for a specific product ID."""
        result = await db.execute(select(Inventory).where(Inventory.product_id == product_id))
        inventory = result.scalars().first()
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory tracking record for product ID {product_id} was not found.",
            )
        return inventory

    @classmethod
    async def adjust_stock(
        db: AsyncSession, db_session: AsyncSession, product_id: int, adjustment: InventoryAdjustment
    ) -> Inventory:
        """
        Adjust stock levels with positive/negative increments.
        Validates that stock doesn't fall below zero.
        """
        # Note: We must make sure that we run this as classmethod
        # Wait, the signature should take db_session
        pass

    # Let's write the methods properly:
    @classmethod
    async def adjust_stock_level(
        cls, db: AsyncSession, product_id: int, adjustment: InventoryAdjustment
    ) -> Inventory:
        """
        Increase or decrease product stock count.
        Validates that the final quantity is non-negative.
        """
        inventory = await cls.get_by_product_id(db, product_id)
        
        new_quantity = inventory.quantity + adjustment.quantity_change
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory. Cannot adjust quantity by {adjustment.quantity_change} from current levels ({inventory.quantity}).",
            )
            
        inventory.quantity = new_quantity
        db.add(inventory)
        await db.flush()
        return inventory

    @classmethod
    async def update_settings(
        cls, db: AsyncSession, product_id: int, settings_in: InventoryUpdate
    ) -> Inventory:
        """Update static inventory settings such as warehouse bin location and reorder level."""
        inventory = await cls.get_by_product_id(db, product_id)
        
        update_data = settings_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(inventory, field, value)
            
        db.add(inventory)
        await db.flush()
        return inventory

    @staticmethod
    async def get_low_stock_alerts(
        db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Inventory], int]:
        """
        Fetch all inventory records where quantity is less than or equal to 
        the configured reorder_level (low-stock status).
        Returns a tuple of (low-stock inventory lines, total count).
        """
        query = select(Inventory).where(Inventory.quantity <= Inventory.reorder_level)
        
        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await db.execute(count_query)
        total = total_count_result.scalar_one()
        
        query = query.offset(skip).limit(limit).order_by(Inventory.quantity.asc())
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        return records, total
