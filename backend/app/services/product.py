from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from typing import List

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    async def get_by_id(db: AsyncSession, product_id: int) -> Product | None:
        """Fetch product by primary key."""
        result = await db.execute(select(Product).where(Product.id == product_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_sku(db: AsyncSession, sku: str) -> Product | None:
        """Fetch product by unique SKU (used for duplicate check)."""
        result = await db.execute(select(Product).where(Product.sku == sku))
        return result.scalars().first()

    @classmethod
    async def create(cls, db: AsyncSession, product_in: ProductCreate) -> Product:
        """
        Create a new product. Validates SKU uniqueness at the application layer
        (DB UNIQUE constraint provides the final safety net for concurrent writes).
        """
        existing = await cls.get_by_sku(db, product_in.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_in.sku}' already exists.",
            )

        db_product = Product(**product_in.model_dump())
        db.add(db_product)
        await db.flush()
        return db_product

    @classmethod
    async def update(
        cls, db: AsyncSession, db_product: Product, product_in: ProductUpdate
    ) -> Product:
        """Update product fields. Validates SKU uniqueness if SKU is being changed."""
        update_data = product_in.model_dump(exclude_unset=True)

        if "sku" in update_data and update_data["sku"] != db_product.sku:
            existing = await cls.get_by_sku(db, update_data["sku"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with SKU '{update_data['sku']}' already exists.",
                )

        for field, value in update_data.items():
            setattr(db_product, field, value)

        db.add(db_product)
        await db.flush()
        return db_product

    @staticmethod
    async def list_products(db: AsyncSession) -> List[Product]:
        """Return all products ordered by name."""
        result = await db.execute(select(Product).order_by(Product.name))
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, db_product: Product) -> None:
        """Delete a product. Will be blocked by DB if any OrderItem references it."""
        await db.delete(db_product)
        await db.flush()
