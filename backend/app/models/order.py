from sqlalchemy import ForeignKey, String, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional

from app.models.base import Base


class Order(Base):
    """
    Order entity tracking aggregate information about sales transactions.
    Linked to a specific Customer.
    """
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",  # Statuses: pending, paid, shipped, cancelled
        nullable=False,
    )
    
    total_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False,
    )
    
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    
    user: Mapped[Optional["User"]] = relationship("User")


class OrderItem(Base):
    """
    Individual items purchased within an Order, capturing frozen pricing and quantities.
    """
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    
    unit_price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
