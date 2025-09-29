# [file name]: security.py
# [file content begin]
from passlib.context import CryptContext
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from backend.authentication import utils, models
from backend.authentication.schemas import UserRole

# Secret key & JWT config
SECRET_KEY = os.environ.get("SECRET_KEY", "devsecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme (FastAPI dependency)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token with expiration."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> models.User:
    """Decode JWT and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Find user in users.json
    users = utils.load_users()
    user_dict = next((u for u in users if u["username"] == username), None)
    if not user_dict:
        raise credentials_exception

    return models.User(**user_dict)


# Role-based access control dependencies
def require_role(required_role: UserRole):
    """Dependency to require specific role."""
    def role_checker(current_user: models.User = Depends(get_current_user)):
        # Define role hierarchy
        role_hierarchy = {
            UserRole.USER: [UserRole.USER],
            UserRole.MODERATOR: [UserRole.USER, UserRole.MODERATOR],
            UserRole.ADMIN: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]
        }
        
        if current_user.role not in role_hierarchy[required_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role or higher"
            )
        return current_user
    return role_checker


# Convenience role checkers
def require_admin(current_user: models.User = Depends(get_current_user)):
    """Require admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires admin role"
        )
    return current_user

def require_moderator(current_user: models.User = Depends(get_current_user)):
    """Require moderator role or higher."""
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires moderator role or higher"
        )
    return current_user
