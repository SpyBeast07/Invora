from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api import deps
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services.customer import CustomerService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CustomerResponse])
async def list_customers(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search customers by Name or Email"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    List customers with pagination and optional search filter.
    Requires active user authentication.
    """
    skip = (page - 1) * size
    customers, total = await CustomerService.list_customers(db, skip=skip, limit=size, search=search)
    
    pages = (total + size - 1) // size
    return PaginatedResponse(
        items=customers,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Fetch customer profile by ID."""
    customer = await CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return customer


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new customer profile.
    Available to all authenticated staff.
    """
    return await CustomerService.create(db, customer_in)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Update customer profile details."""
    customer = await CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return await CustomerService.update(db, customer, customer_in)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(deps.RoleChecker(["admin", "manager"]))],
)
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Delete a customer profile. Cascade deletes orders.
    Restricted to Admins and Managers.
    """
    customer = await CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    await CustomerService.delete(db, customer)
    return None
