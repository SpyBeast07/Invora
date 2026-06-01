import asyncio
import logging
from sqlalchemy import select

from app.core.database import engine, SessionLocal
from app.models import Base, Product, Customer, Order, OrderItem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

products_data = [
    {"sku": "WHL-001", "name": "Organic Wheat Flour", "price": 12.99, "quantity_in_stock": 150},
    {"sku": "RCE-002", "name": "Basmati Rice (5kg)", "price": 24.50, "quantity_in_stock": 80},
    {"sku": "OLV-003", "name": "Extra Virgin Olive Oil", "price": 18.75, "quantity_in_stock": 120},
    {"sku": "ALM-004", "name": "Raw Almonds (1kg)", "price": 9.99, "quantity_in_stock": 200},
    {"sku": "HNY-005", "name": "Pure Wild Honey", "price": 14.25, "quantity_in_stock": 60},
    {"sku": "GRN-006", "name": "Green Tea (100 Bags)", "price": 7.50, "quantity_in_stock": 90},
    {"sku": "CHS-007", "name": "Aged Cheddar Cheese", "price": 22.00, "quantity_in_stock": 40},
    {"sku": "PST-008", "name": "Artisan Pasta Pack", "price": 11.30, "quantity_in_stock": 75},
    {"sku": "CRF-009", "name": "Medium Roast Coffee", "price": 16.80, "quantity_in_stock": 110},
    {"sku": "DRK-010", "name": "Dark Chocolate Bar", "price": 5.99, "quantity_in_stock": 250},
]

customers_data = [
    {"full_name": "Alice Johnson", "email": "alice@example.com", "phone_number": "+1-555-0101"},
    {"full_name": "Bob Martinez", "email": "bob@example.com", "phone_number": "+1-555-0102"},
    {"full_name": "Clara Davis", "email": "clara@example.com", "phone_number": "+1-555-0103"},
    {"full_name": "Derek Smith", "email": "derek@example.com", "phone_number": None},
    {"full_name": "Eva Chen", "email": "eva@example.com", "phone_number": "+1-555-0105"},
]


async def seed() -> None:
    logger.info("Creating tables if they do not exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        result = await session.execute(select(Product))
        existing_products = len(result.scalars().all())
        if existing_products > 0:
            logger.info("Database already contains data. Skipping seed.")
            return

        logger.info("Seeding products...")
        products = [Product(**p) for p in products_data]
        session.add_all(products)
        await session.flush()

        logger.info("Seeding customers...")
        customers = [Customer(**c) for c in customers_data]
        session.add_all(customers)
        await session.flush()

        logger.info("Seeding orders and order items...")
        order_1 = Order(customer_id=customers[0].id, total_amount=61.48)
        order_1.items = [
            OrderItem(product_id=products[0].id, quantity=2, unit_price=products[0].price),
            OrderItem(product_id=products[4].id, quantity=1, unit_price=products[4].price),
            OrderItem(product_id=products[9].id, quantity=3, unit_price=products[9].price),
        ]

        order_2 = Order(customer_id=customers[0].id, total_amount=33.00)
        order_2.items = [
            OrderItem(product_id=products[7].id, quantity=1, unit_price=products[7].price),
            OrderItem(product_id=products[5].id, quantity=2, unit_price=products[5].price),
        ]

        order_3 = Order(customer_id=customers[1].id, total_amount=37.50)
        order_3.items = [
            OrderItem(product_id=products[2].id, quantity=2, unit_price=products[2].price),
        ]

        order_4 = Order(customer_id=customers[2].id, total_amount=49.48)
        order_4.items = [
            OrderItem(product_id=products[1].id, quantity=1, unit_price=products[1].price),
            OrderItem(product_id=products[3].id, quantity=2, unit_price=products[3].price),
            OrderItem(product_id=products[8].id, quantity=1, unit_price=products[8].price),
        ]

        order_5 = Order(customer_id=customers[3].id, total_amount=31.99)
        order_5.items = [
            OrderItem(product_id=products[6].id, quantity=1, unit_price=products[6].price),
            OrderItem(product_id=products[9].id, quantity=1, unit_price=products[9].price),
            OrderItem(product_id=products[5].id, quantity=1, unit_price=products[5].price),
        ]

        session.add_all([order_1, order_2, order_3, order_4, order_5])
        await session.commit()

    logger.info("Seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
