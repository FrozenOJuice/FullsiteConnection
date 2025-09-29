# [file name]: utils.py
# [file content begin]
import os
import json
from typing import List, Dict, Any
from backend.authentication.schemas import UserRole

# Define the path to point to your data directory
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "users.json")

def load_users() -> List[Dict[str, Any]]:
    """Load all users from users.json. Returns an empty list if file is missing/empty."""
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        try:
            users = json.load(f)
            # Ensure all users have a role (backward compatibility)
            for user in users:
                if "role" not in user:
                    user["role"] = UserRole.USER.value
            return users
        except json.JSONDecodeError:
            return []

def save_users(users: List[Dict[str, Any]]) -> None:
    """Save users list back to users.json."""
    # Ensure data directory exists
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)
