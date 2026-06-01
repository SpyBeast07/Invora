from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from typing import List, Tuple, Optional

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    async def get_by_id(db: AsyncSession, product_id: int) -> Product | None:
        """Fetch product by its primary key ID."""
        result = await db.execute(select(Product).where(Product.id == product_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_sku(db: AsyncSession, sku: str) -> Product | None:
        """Fetch product by its unique SKU code."""
        result = await db.execute(select(Product).where(Product.sku == sku))
        return result.scalars().first()

    @classmethod
    async def create(cls, db: AsyncSession, product_in: ProductCreate) -> Product:
        """
        Create a new product.
        """
        existing_product = await cls.get_by_sku(db, product_in.sku)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product SKU '{product_in.sku}' already exists.",
            )
        
        db_product = Product(**product_in.model_dump())
        db.add(db_product)
        await db.flush()  # Obtain id

        return db_product

    @classmethod
    async def update(
        cls, db: AsyncSession, db_product: Product, product_in: ProductUpdate
    ) -> Product:
        """Update existing product details. Handles SKU unique constraints checks."""
        update_data = product_in.model_dump(exclude_unset=True)
        
        if "sku" in update_data and update_data["sku"] != db_product.sku:
            existing = await cls.get_by_sku(db, update_data["sku"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product SKU '{update_data['sku']}' is already in use by another product.",
                )
        
        for field, value in update_data.items():
            setattr(db_product, field, value)
            
        db.add(db_product)
        await db.flush()
        return db_product

    @staticmethod
    async def list_products(
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Product], int]:
        """
        Retrieve catalog products matching pagination and filters.
        Returns a tuple of (list of products, total matching count).
        """
        query = select(Product)
        
        # Category Filter
        if category:
            query = query.where(Product.category == category)
            
        # Search filter (name or SKU match)
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                )
            )
            
        # Get count query first
        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await db.execute(count_query)
        total = total_count_result.scalar_one()
        
        # Paginated results query
        query = query.offset(skip).limit(limit).order_by(Product.name)
        result = await db.execute(query)
        products = list(result.scalars().all())
        
        return products, total

    @staticmethod
    async def delete(db: AsyncSession, db_product: Product) -> None:
        """Deletes a product and Cascade cleanses associated inventory/items."""
        await db.delete(db_product)
        await db.flush()
