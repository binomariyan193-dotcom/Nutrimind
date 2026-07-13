from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.presentation.api.dependencies.database import get_db
from app.infrastructure.database.models import User

security = HTTPBearer(auto_error=False)

class MockUser:
    def __init__(self, id):
        self.id = id

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Bypass Supabase Authentication completely.
    # Find the first user in the database to act as the universal demo user.
    user = db.query(User).first()
    
    # If no users exist in the database at all, create one.
    if not user:
        user = User(email="demo@nutrimind.app")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return MockUser(id=str(user.id))
