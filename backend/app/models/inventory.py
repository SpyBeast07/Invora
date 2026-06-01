from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Inventory(Base):
    """
    Inventory entity tracking specific stock quantities, physical warehouse locations,
    and minimum threshold limits for products.
    """
    __tablename__ = "inventories"

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        unique=True,  # Ensure 1-to-1 relationship mapping per product for current levels
        nullable=False,
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    reorder_level: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="inventory_records",
    )
