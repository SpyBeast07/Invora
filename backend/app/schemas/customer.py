from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address for the customer")
    phone_number: Optional[str] = Field(None, max_length=50, description="Contact phone number")


class CustomerResponse(BaseModel):
    """
    Response schema exposing spec-required fields only:
    id, full_name, email, phone_number, created_at.
    (updated_at exists in DB but is not required by spec.)
    """
    id: int
    full_name: str
    email: str
    phone_number: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
