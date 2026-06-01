from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ------------------------------------------------------------------------------
# Core User Schemas
# ------------------------------------------------------------------------------

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Unique email address for the user")
    full_name: Optional[str] = Field(None, description="Full name of the user")
    role: str = Field("operator", description="Access role: admin, manager, or operator")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, description="Update password if provided")
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# Authentication Token Schemas
# ------------------------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
