from pydantic import BaseModel
from typing import List, Dict, Any

class AdminStatsResponse(BaseModel):
    total_users: int
    daily_active_users: int
    meals_uploaded: int
    calories_processed: int
    ai_requests: int
    trend_data: List[Dict[str, Any]]
