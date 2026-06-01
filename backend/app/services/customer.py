from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from typing import List

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


class CustomerService:
    @staticmethod
    async def get_by_id(db: AsyncSession, customer_id: int) -> Customer | None:
        """Fetch customer by primary key."""
        result = await db.execute(select(Customer).where(Customer.id == customer_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Customer | None:
        """Fetch customer by email (used for duplicate check)."""
        result = await db.execute(select(Customer).where(Customer.email == email))
        return result.scalars().first()

    @classmethod
    async def create(cls, db: AsyncSession, customer_in: CustomerCreate) -> Customer:
        """
        Create a new customer. Validates email uniqueness at the application layer
        (DB UNIQUE constraint provides the final safety net for concurrent writes).
        """
        existing = await cls.get_by_email(db, customer_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A customer with email '{customer_in.email}' already exists.",
            )

        db_customer = Customer(**customer_in.model_dump())
        db.add(db_customer)
        await db.flush()
        return db_customer

    @staticmethod
    async def list_customers(db: AsyncSession) -> List[Customer]:
        """Return all customers ordered by full_name."""
        result = await db.execute(select(Customer).order_by(Customer.full_name))
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, db_customer: Customer) -> None:
        """Delete a customer. Cascades to delete their orders."""
        await db.delete(db_customer)
        await db.flush()
