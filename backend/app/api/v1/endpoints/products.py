from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api import deps
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product import ProductService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter products by category"),
    search: Optional[str] = Query(None, description="Search products by SKU or Name"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    List catalog products with pagination, category filter, and global text search.
    Requires active user authentication.
    """
    skip = (page - 1) * size
    products, total = await ProductService.list_products(
        db, skip=skip, limit=size, category=category, search=search
    )
    
    pages = (total + size - 1) // size
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch product details by ID. Requires active authentication."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return product


@router.get("/sku/{sku}", response_model=ProductResponse)
async def get_product_by_sku(
    sku: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch product details by SKU. Requires active authentication."""
    product = await ProductService.get_by_sku(db, sku)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with SKU '{sku}' not found."
        )
    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager"]))],
)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Register a new product in the catalog.
    Automatically initializes tracking inventory to zero stock.
    Restricted to Admin and Manager roles.
    """
    return await ProductService.create(db, product_in)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager"]))],
)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Update catalog details for a product.
    Restricted to Admin and Manager roles.
    """
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return await ProductService.update(db, product, product_in)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(deps.RoleChecker(["admin"]))],
)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Delete a product from the database catalog.
    Cascade cleanses associated inventory.
    Restricted to Admin role only.
    """
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    await ProductService.delete(db, product)
    return None
