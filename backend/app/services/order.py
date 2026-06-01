from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from typing import List

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate


class OrderService:
    @classmethod
    async def create_order(cls, db: AsyncSession, order_in: OrderCreate) -> Order:
        """
        Create a new order within the current session transaction.

        The session (provided by get_db) operates within an implicit transaction:
        - Commit happens after the request handler returns successfully.
        - Rollback happens automatically if any exception is raised.

        This guarantees atomicity: if stock deduction for product N fails,
        all prior stock deductions in the same request are rolled back.
        """
        # Validate customer exists
        customer = await db.get(Customer, order_in.customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {order_in.customer_id} not found.",
            )

        total_amount = 0.0
        order_items: List[OrderItem] = []

        for item_in in order_in.items:
            product = await db.get(Product, item_in.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} not found.",
                )

            # Rule: orders cannot be created if inventory is insufficient
            if product.quantity_in_stock < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for '{product.name}'. "
                        f"Requested: {item_in.quantity}, Available: {product.quantity_in_stock}."
                    ),
                )

            # Rule: creating an order must automatically reduce inventory
            product.quantity_in_stock -= item_in.quantity
            db.add(product)

            unit_price = float(product.price)
            total_amount += unit_price * item_in.quantity

            order_items.append(OrderItem(
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=unit_price,
            ))

        # Rule: order total must be calculated automatically by the backend
        db_order = Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount,
            items=order_items,
        )

        db.add(db_order)
        await db.flush()
        await db.refresh(db_order, ["customer", "items"])
        return db_order

    @staticmethod
    async def get_by_id(db: AsyncSession, order_id: int) -> Order | None:
        """Fetch order by primary key, eager-loading items and customer."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .where(Order.id == order_id)
        )
        return result.scalars().first()

    @staticmethod
    async def list_orders(db: AsyncSession) -> List[Order]:
        """Return all orders ordered by newest first, with items and customer."""
        result = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .order_by(Order.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, db_order: Order) -> None:
        """
        Delete an order and restore product stock.
        Stock restoration ensures inventory stays consistent when an order is removed.
        """
        await db.refresh(db_order, ["items"])
        for item in db_order.items:
            product = await db.get(Product, item.product_id)
            if product:
                product.quantity_in_stock += item.quantity
                db.add(product)

        await db.delete(db_order)
        await db.flush()
