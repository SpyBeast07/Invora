from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.services.customer import CustomerService

router = APIRouter()


@router.get("", response_model=List[CustomerResponse])
async def list_customers(db: AsyncSession = Depends(get_db)):
    """GET /customers — Return all customers."""
    return await CustomerService.list_customers(db)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """GET /customers/{id} — Return customer by ID."""
    customer = await CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )
    return customer


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(customer_in: CustomerCreate, db: AsyncSession = Depends(get_db)):
    """POST /customers — Create a new customer."""
    return await CustomerService.create(db, customer_in)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """DELETE /customers/{id} — Delete a customer."""
    customer = await CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )
    await CustomerService.delete(db, customer)
    return None
