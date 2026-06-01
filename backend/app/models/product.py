from sqlalchemy import String, Numeric, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.models.base import Base


class Product(Base):
    """
    Product entity. Fields exactly as per spec:
    id, name, sku, price, quantity_in_stock, created_at, updated_at.
    """
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price > 0", name="ck_product_price_positive"),
        CheckConstraint("quantity_in_stock >= 0", name="ck_product_qty_nonnegative"),
    )

    sku: Mapped[str] = mapped_column(
        String(100),
        unique=True,   # DB-level UNIQUE constraint
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    quantity_in_stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )
