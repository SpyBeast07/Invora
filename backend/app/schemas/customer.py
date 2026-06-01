import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address for the customer")
    phone_number: Optional[str] = Field(None, max_length=50, description="Contact phone number")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        # Allow international E.164 formats, or standard standard US formats
        # e.g., +1234567890, 123-456-7890, +1 (123) 456-7890
        pattern = r"^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$|^\+?\d{7,15}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid phone number format. Standard formats: +1234567890, 123-456-7890, or +1 (123) 456-7890")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=50)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return CustomerBase.validate_phone(v)


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
