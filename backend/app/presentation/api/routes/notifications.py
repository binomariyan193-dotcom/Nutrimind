from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.notification import NotificationListResponse
from app.infrastructure.database.models import Notification
from app.application.services.notification import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates new notifications and returns the user's notification list.
    """
    # Evaluate rules first
    try:
        NotificationService.evaluate_and_generate(db=db, user_id=str(current_user.id))
    except Exception as e:
        print(f"Notification evaluation error: {e}")
        
    # Fetch notifications
    notifications = db.query(Notification)\
                      .filter(Notification.user_id == str(current_user.id))\
                      .order_by(Notification.timestamp.desc())\
                      .limit(50)\
                      .all()
                      
    unread_count = sum(1 for n in notifications if not n.is_read)
    
    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count
    )

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks a specific notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id, 
        Notification.user_id == str(current_user.id)
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"status": "success"}
