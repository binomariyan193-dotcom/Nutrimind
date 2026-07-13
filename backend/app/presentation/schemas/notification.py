from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    notification_type: str
    message: str
    is_read: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
