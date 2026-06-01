from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.dashboard import DashboardResponse


class DashboardService:
    @staticmethod
    async def get_metrics(db: AsyncSession) -> DashboardResponse:
        """
        Gathers system-wide aggregates and stock warnings.
        Runs a highly optimized single-query round-trip using scalar subqueries.
        """
        # Define scalar subqueries for each target metric
        product_count = select(func.count(Product.id)).scalar_subquery()
        customer_count = select(func.count(Customer.id)).scalar_subquery()
        order_count = select(func.count(Order.id)).scalar_subquery()
        
        # Consider quantity <= 5 as low stock alert threshold
        low_stock_count = select(func.count(Product.id)).where(
            Product.quantity_in_stock <= 5
        ).scalar_subquery()

        # Execute all aggregates in one database round-trip
        result = await db.execute(
            select(product_count, customer_count, order_count, low_stock_count)
        )
        row = result.first()
        
        total_products, total_customers, total_orders, low_stock_products = (
            row if row else (0, 0, 0, 0)
        )

        return DashboardResponse(
            total_products=total_products,
            total_customers=total_customers,
            total_orders=total_orders,
            low_stock_products=low_stock_products,
        )
