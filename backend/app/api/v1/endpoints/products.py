from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product import ProductService

router = APIRouter()


@router.get("", response_model=List[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db)):
    """GET /products — Return all products."""
    return await ProductService.list_products(db)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """GET /products/{id} — Return product by ID."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    """POST /products — Create a new product."""
    return await ProductService.create(db, product_in)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    """PUT /products/{id} — Update an existing product."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return await ProductService.update(db, product, product_in)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """DELETE /products/{id} — Delete a product."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    await ProductService.delete(db, product)
    return None
