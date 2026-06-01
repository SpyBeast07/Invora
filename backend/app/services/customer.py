from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from typing import List, Tuple, Optional

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    @staticmethod
    async def get_by_id(db: AsyncSession, customer_id: int) -> Customer | None:
        """Fetch customer by its primary key ID."""
        result = await db.execute(select(Customer).where(Customer.id == customer_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Customer | None:
        """Fetch customer by email address."""
        result = await db.execute(select(Customer).where(Customer.email == email))
        return result.scalars().first()

    @classmethod
    async def create(cls, db: AsyncSession, customer_in: CustomerCreate) -> Customer:
        """
        Create a new customer profile.
        Validates email uniqueness.
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

    @classmethod
    async def update(
        cls, db: AsyncSession, db_customer: Customer, customer_in: CustomerUpdate
    ) -> Customer:
        """Update customer details. Handles email uniqueness constraints."""
        update_data = customer_in.model_dump(exclude_unset=True)
        
        if "email" in update_data and update_data["email"] != db_customer.email:
            existing = await cls.get_by_email(db, update_data["email"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{update_data['email']}' is already in use by another customer.",
                )
        
        for field, value in update_data.items():
            setattr(db_customer, field, value)
            
        db.add(db_customer)
        await db.flush()
        return db_customer

    @staticmethod
    async def list_customers(
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
    ) -> Tuple[List[Customer], int]:
        """
        Retrieve customers matching pagination and global search (name/email).
        """
        query = select(Customer)
        
        if search:
            query = query.where(
                or_(
                    Customer.full_name.ilike(f"%{search}%"),
                    Customer.email.ilike(f"%{search}%"),
                )
            )
            
        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await db.execute(count_query)
        total = total_count_result.scalar_one()
        
        query = query.offset(skip).limit(limit).order_by(Customer.full_name)
        result = await db.execute(query)
        customers = list(result.scalars().all())
        
        return customers, total

    @staticmethod
    async def delete(db: AsyncSession, db_customer: Customer) -> None:
        """Deletes a customer profile. Cascade clearses associated orders."""
        await db.delete(db_customer)
        await db.flush()
