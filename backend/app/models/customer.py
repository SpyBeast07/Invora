from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.models.base import Base


class Customer(Base):
    """
    Customer entity representing clients placing orders.
    """
    __tablename__ = "customers"

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    phone_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Relationships
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
