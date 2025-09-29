# [file name]: router.py
# [file content begin]
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from backend.authentication import schemas, utils, security
from backend.authentication.schemas import UserRole
from backend.authentication.security import require_role, require_admin, require_moderator

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate):
    users = utils.load_users()

    # Check if username already exists
    if any(u["username"] == user.username for u in users):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Check if email already exists
    if any(u["email"] == user.email for u in users):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user object
    new_user = {
        "id": len(users) + 1,
        "username": user.username,
        "email": user.email,
        "hashed_password": security.hash_password(user.password),
        "role": user.role.value  # Store enum value
    }

    users.append(new_user)
    utils.save_users(users)

    # Return only safe user data (no password)
    return {
        "username": new_user["username"],
        "email": new_user["email"],
        "role": new_user["role"]
    }

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = utils.load_users()
    user = next((u for u in users if u["username"] == form_data.username), None)

    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(
        data={"sub": user["username"], "user_id": user["id"], "role": user["role"]}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user["role"]
    }

@router.post("/logout")
def logout():
    """
    Logout endpoint. For JWTs, this is stateless: instruct the client to discard the token.
    """
    return {"message": "Successfully logged out. Please discard your token on the client side."}


# Protected routes with role-based access

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(current_user: schemas.UserResponse = Depends(security.get_current_user)):
    """Get current user info (requires authentication)"""
    return current_user

@router.get("/admin-only")
def admin_only_route(current_user = Depends(security.require_admin)):
    """Only accessible by admins"""
    return {"message": "Welcome admin!", "user": current_user.username}

@router.get("/moderator-dashboard")
def moderator_dashboard(current_user = Depends(security.require_moderator)):
    """Accessible by moderators and admins"""
    return {"message": "Moderator dashboard", "user": current_user.username}

@router.get("/user-profile")
def user_profile(current_user = Depends(security.require_role(UserRole.USER))):
    """Accessible by all authenticated users"""
    return {"message": "User profile", "user": current_user.username}

# Admin management endpoints
@router.get("/users", dependencies=[Depends(security.require_admin)])
def list_all_users():
    """List all users (admin only)"""
    users = utils.load_users()
    # Remove passwords from response
    safe_users = [
        {k: v for k, v in user.items() if k != "hashed_password"}
        for user in users
    ]
    return {"users": safe_users}

@router.put("/users/{user_id}/role", dependencies=[Depends(security.require_admin)])
def update_user_role(user_id: int, role_update: schemas.UserUpdate):
    """Update user role (admin only)"""
    users = utils.load_users()
    
    user_index = next((i for i, u in enumerate(users) if u["id"] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role_update.role:
        users[user_index]["role"] = role_update.role.value
    
    utils.save_users(users)
    return {"message": "User role updated successfully"}
