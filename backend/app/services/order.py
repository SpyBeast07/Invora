import random
import string
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from typing import List, Tuple, Optional

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.order import OrderCreate, OrderUpdate
from app.services.inventory import InventoryService


class OrderService:
    @staticmethod
    def _generate_order_number() -> str:
        """Generate a random unique, clean order number: INV-YYYYMMDD-XXXX."""
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"INV-{date_str}-{random_suffix}"

    @classmethod
    async def create_order(
        cls, db: AsyncSession, order_in: OrderCreate, user_id: Optional[int] = None
    ) -> Order:
        """
        Processes and creates a new customer order.
        Validates inventory stock availability for each product, locks in unit price 
        from the product catalog, decrements stock levels, and computes totals.
        Uses clean ACID transactional flow.
        """
        order_number = cls._generate_order_number()
        total_amount = 0.00
        order_items: List[OrderItem] = []

        # 1. Iterate and validate each item in the order request
        for item_in in order_in.items:
            # Fetch catalog product
            product = await db.get(Product, item_in.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} does not exist.",
                )
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is currently inactive and cannot be ordered.",
                )

            # Fetch inventory levels
            inventory_res = await db.execute(
                select(Inventory).where(Inventory.product_id == item_in.product_id)
            )
            inventory = inventory_res.scalars().first()
            if not inventory or inventory.quantity < item_in.quantity:
                current_qty = inventory.quantity if inventory else 0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for product '{product.name}'. "
                        f"Requested: {item_in.quantity}, Available: {current_qty}."
                    ),
                )

            # Deduct inventory count
            inventory.quantity -= item_in.quantity
            db.add(inventory)

            # Build OrderItem model locking catalog price
            unit_price = float(product.price)
            item_total = unit_price * item_in.quantity
            total_amount += item_total

            order_item = OrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=unit_price,
            )
            order_items.append(order_item)

        # 2. Construct parent Order model
        db_order = Order(
            order_number=order_number,
            customer_name=order_in.customer_name,
            customer_email=order_in.customer_email,
            status="pending",
            total_amount=total_amount,
            user_id=user_id,
            items=order_items,
        )
        
        db.add(db_order)
        await db.flush()  # Obtain ID and finalize structures
        return db_order

    @staticmethod
    async def get_by_id(db: AsyncSession, order_id: int) -> Order | None:
        """Retrieve order details by ID, eager loading line items."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_number(db: AsyncSession, order_number: str) -> Order | None:
        """Retrieve order details by order_number code, eager loading line items."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.order_number == order_number)
        )
        return result.scalars().first()

    @classmethod
    async def update_status(
        cls, db: AsyncSession, db_order: Order, update_in: OrderUpdate
    ) -> Order:
        """
        Updates order fulfillment status.
        If status transitions to 'cancelled', we automatically return reserved quantities
        back to the corresponding warehouse inventories.
        """
        old_status = db_order.status.lower()
        new_status = update_in.status.lower()

        if old_status == new_status:
            return db_order

        # Handle cancellation: Restore inventory stock levels
        if new_status == "cancelled" and old_status != "cancelled":
            # Eager load items if not already available
            await db.refresh(db_order, ["items"])
            for item in db_order.items:
                res = await db.execute(
                    select(Inventory).where(Inventory.product_id == item.product_id)
                )
                inventory = res.scalars().first()
                if inventory:
                    inventory.quantity += item.quantity
                    db.add(inventory)

        # Handle un-cancelling (if an admin moves a cancelled order back to active)
        elif old_status == "cancelled" and new_status != "cancelled":
            await db.refresh(db_order, ["items"])
            for item in db_order.items:
                res = await db.execute(
                    select(Inventory).where(Inventory.product_id == item.product_id)
                )
                inventory = res.scalars().first()
                if not inventory or inventory.quantity < item.quantity:
                    product_name_res = await db.execute(
                        select(Product.name).where(Product.id == item.product_id)
                    )
                    prod_name = product_name_res.scalar() or f"ID {item.product_id}"
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot reactivate order. Insufficient stock to reserve product '{prod_name}'.",
                    )
                inventory.quantity -= item.quantity
                db.add(inventory)

        db_order.status = new_status
        db.add(db_order)
        await db.flush()
        return db_order

    @staticmethod
    async def list_orders(
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Order], int]:
        """
        Retrieve order transactions matching pagination and filters.
        Returns a tuple of (list of orders, total matching count).
        """
        query = select(Order).options(selectinload(Order.items))
        
        if status_filter:
            query = query.where(Order.status == status_filter)
            
        if search:
            query = query.where(
                or_(
                    Order.order_number.ilike(f"%{search}%"),
                    Order.customer_name.ilike(f"%{search}%"),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await db.execute(count_query)
        total = total_count_result.scalar_one()

        query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
        result = await db.execute(query)
        orders = list(result.scalars().all())
        
        return orders, total
