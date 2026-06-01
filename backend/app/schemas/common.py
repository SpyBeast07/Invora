from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class Message(BaseModel):
    """Generic message response schema."""
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized paginated response envelope."""
    items: List[T]
    total: int = Field(..., description="Total count of items matching the query")
    page: int = Field(..., description="Current page index (1-based)")
    size: int = Field(..., description="Number of items per page")
    pages: int = Field(..., description="Total number of pages available")
