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
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate


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
        Validates product availability directly against Product.quantity_in_stock,
        locks catalog prices, decrements stock, and links Customer references.
        """
        # Validate Customer existence
        customer = await db.get(Customer, order_in.customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {order_in.customer_id} does not exist.",
            )

        order_number = cls._generate_order_number()
        total_amount = 0.00
        order_items: List[OrderItem] = []

        # Iterate and validate each item in order request
        for item_in in order_in.items:
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

            # Check quantity directly in product
            if product.quantity_in_stock < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for product '{product.name}'. "
                        f"Requested: {item_in.quantity}, Available: {product.quantity_in_stock}."
                    ),
                )

            # Deduct directly from Product stock
            product.quantity_in_stock -= item_in.quantity
            db.add(product)

            unit_price = float(product.price)
            item_total = unit_price * item_in.quantity
            total_amount += item_total

            order_item = OrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=unit_price,
            )
            order_items.append(order_item)

        # Construct Order model
        db_order = Order(
            order_number=order_number,
            customer_id=order_in.customer_id,
            status="pending",
            total_amount=total_amount,
            user_id=user_id,
            items=order_items,
        )
        
        db.add(db_order)
        await db.flush()  # Obtain ID and finalize structures
        
        # Eager load relationships for return response
        await db.refresh(db_order, ["customer", "items"])
        return db_order

    @staticmethod
    async def get_by_id(db: AsyncSession, order_id: int) -> Order | None:
        """Retrieve order details by ID, eager loading line items and customer info."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .where(Order.id == order_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_number(db: AsyncSession, order_number: str) -> Order | None:
        """Retrieve order details by order_number, eager loading line items and customer info."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .where(Order.order_number == order_number)
        )
        return result.scalars().first()

    @classmethod
    async def update_status(
        cls, db: AsyncSession, db_order: Order, update_in: OrderUpdate
    ) -> Order:
        """
        Updates order status.
        If transitioned to 'cancelled', return stock directly to Product quantity.
        """
        old_status = db_order.status.lower()
        new_status = update_in.status.lower()

        if old_status == new_status:
            return db_order

        # Handle cancellation: Restore Product stock levels
        if new_status == "cancelled" and old_status != "cancelled":
            await db.refresh(db_order, ["items"])
            for item in db_order.items:
                product = await db.get(Product, item.product_id)
                if product:
                    product.quantity_in_stock += item.quantity
                    db.add(product)

        # Handle un-cancelling
        elif old_status == "cancelled" and new_status != "cancelled":
            await db.refresh(db_order, ["items"])
            for item in db_order.items:
                product = await db.get(Product, item.product_id)
                if not product or product.quantity_in_stock < item.quantity:
                    prod_name = product.name if product else f"ID {item.product_id}"
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot reactivate order. Insufficient stock to reserve product '{prod_name}'.",
                    )
                product.quantity_in_stock -= item.quantity
                db.add(product)

        db_order.status = new_status
        db.add(db_order)
        await db.flush()
        await db.refresh(db_order, ["customer", "items"])
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
        Retrieve order transactions matching pagination, status, and search filters.
        Joins the Customer table to allow text searches on customer names.
        """
        query = select(Order).join(Customer).options(selectinload(Order.items), selectinload(Order.customer))
        
        if status_filter:
            query = query.where(Order.status == status_filter)
            
        if search:
            query = query.where(
                or_(
                    Order.order_number.ilike(f"%{search}%"),
                    Customer.full_name.ilike(f"%{search}%"),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await db.execute(count_query)
        total = total_count_result.scalar_one()

        query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
        result = await db.execute(query)
        orders = list(result.scalars().all())
        
        return orders, total

    @staticmethod
    async def delete(db: AsyncSession, db_order: Order) -> None:
        """
        Deletes an order.
        If the order status is NOT 'cancelled', restore the stock back to the products!
        """
        await db.refresh(db_order, ["items"])
        if db_order.status.lower() != "cancelled":
            for item in db_order.items:
                product = await db.get(Product, item.product_id)
                if product:
                    product.quantity_in_stock += item.quantity
                    db.add(product)
        await db.delete(db_order)
        await db.flush()
