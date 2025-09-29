# [file name]: models.py
# [file content begin]
from pydantic import BaseModel
from typing import Optional
from backend.authentication.schemas import UserRole

class User(BaseModel):
    id: int
    username: str
    email: str
    hashed_password: str
    role: UserRole
    
    class Config:
        from_attributes = True
