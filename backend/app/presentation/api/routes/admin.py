from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.presentation.api.dependencies.database import get_db
from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.schemas.admin import AdminStatsResponse
from app.infrastructure.database.models import User, Meal, Nutrition

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user = Depends(get_current_user), # Requires any logged in user for prototype
    db: Session = Depends(get_db)
):
    """
    Returns system-wide analytics for the Admin Dashboard.
    """
    # 1. Total Users
    total_users = db.query(User).count()
    
    # 2. Meals Uploaded
    meals_uploaded = db.query(Meal).count()
    
    # 3. Calories Processed
    calories_processed = db.query(func.sum(Nutrition.calories)).scalar() or 0
    calories_processed = int(calories_processed)
    
    # 4. Daily Active Users (DAU) - Unique users who logged a meal in last 24h
    yesterday = datetime.now() - timedelta(days=1)
    dau = db.query(func.count(func.distinct(Meal.user_id))).filter(Meal.timestamp >= yesterday).scalar() or 0
    
    # 5. AI Requests (Approximated for prototype based on meal volume + buffer)
    ai_requests = int(meals_uploaded * 1.5)
    
    # 6. Trend Data (Meals uploaded over the last 7 days for the chart)
    trend_data = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).date()
        count = db.query(Meal).filter(func.date(Meal.timestamp) == day).count()
        trend_data.append({
            "date": day.strftime("%b %d"),
            "meals": count
        })
        
    return AdminStatsResponse(
        total_users=total_users,
        daily_active_users=dau,
        meals_uploaded=meals_uploaded,
        calories_processed=calories_processed,
        ai_requests=ai_requests,
        trend_data=trend_data
    )
