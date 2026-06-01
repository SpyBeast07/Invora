from sqlalchemy import String, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.models.base import Base


class Product(Base):
    """
    Product entity representing catalog items available for tracking and sales.
    """
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    
    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )
    
    category: Mapped[str | None] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    
    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    inventory_records: Mapped[List["Inventory"]] = relationship(
        "Inventory",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )
