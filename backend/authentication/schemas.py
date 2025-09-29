# [file name]: schemas.py
# [file content begin]
from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

# Shared properties
class UserBase(BaseModel):
    username: str
    email: EmailStr


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.USER  # Default role
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


# Properties to receive via API on login
class UserLogin(BaseModel):
    username: str
    password: str


# Properties to return via API (safe user data)
class UserResponse(UserBase):
    role: UserRole
    
    class Config:
        from_attributes = True


# Token response schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole  # Add role to token response


# Admin user update schema
class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    email: Optional[EmailStr] = None
