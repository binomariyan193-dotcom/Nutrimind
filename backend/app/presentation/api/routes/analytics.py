from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date as date_type
from typing import Optional

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.analytics import DailyHealthAnalysisResponse
from app.application.services.health_analysis import HealthAnalysisEngine

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/daily", response_model=DailyHealthAnalysisResponse)
async def get_daily_analytics(
    date: Optional[date_type] = Query(default_factory=date_type.today, description="The date to fetch analytics for (YYYY-MM-DD). Defaults to today."),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the comprehensive daily health analysis for the authenticated user on the specified date.
    Aggregates nutrition, evaluates medical constraints, and calculates overall health scores.
    """
    try:
        # Run the analysis engine
        analysis = HealthAnalysisEngine.generate_daily_analysis(db=db, user_id=str(current_user.id), target_date=date)
        return analysis
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")

from datetime import timedelta, datetime
from app.infrastructure.database.models import Meal, Nutrition, Profile
from app.presentation.schemas.analytics import TrendAnalyticsResponse, TrendDataPoint
from sqlalchemy import func

@router.get("/trends", response_model=TrendAnalyticsResponse)
async def get_trend_analytics(
    period: str = Query("weekly", description="'weekly' or 'monthly'"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches aggregated trend data for charts based on the specified period.
    """
    today = date_type.today()
    
    if period == "weekly":
        start_date = today - timedelta(days=6)
        days = 7
    elif period == "monthly":
        start_date = today - timedelta(days=29)
        days = 30
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use 'weekly' or 'monthly'.")
        
    # Get Profile for target baselines
    profile = db.query(Profile).filter(Profile.user_id == str(current_user.id)).first()
    baselines = HealthAnalysisEngine.calculate_baselines(profile) if profile else {"tdee": 2000, "macros": {}}
    target_cals = baselines.get("tdee", 2000)
    static_weight = profile.weight_kg if profile else None

    # Fetch all nutrition data in the date range
    meals_data = db.query(
        func.date(Meal.timestamp).label('day'),
        func.sum(Nutrition.calories).label('cal'),
        func.sum(Nutrition.protein_g).label('pro'),
        func.sum(Nutrition.carbs_g).label('carb'),
        func.sum(Nutrition.fat_g).label('fat')
    ).join(Nutrition, Nutrition.meal_id == Meal.id)\
     .filter(Meal.user_id == str(current_user.id), func.date(Meal.timestamp) >= start_date, func.date(Meal.timestamp) <= today)\
     .group_by(func.date(Meal.timestamp)).all()
     
    # Convert query results to dict keyed by date string
    data_by_day = {str(m.day): m for m in meals_data}
    
    trend_data = []
    
    if period == "weekly":
        # Group by day
        for i in range(days):
            d = start_date + timedelta(days=i)
            d_str = str(d)
            label = d.strftime("%a") # 'Mon', 'Tue'
            
            day_data = data_by_day.get(d_str)
            trend_data.append(TrendDataPoint(
                label=label,
                calories=float(day_data.cal) if day_data and day_data.cal else 0,
                protein_g=float(day_data.pro) if day_data and day_data.pro else 0,
                carbs_g=float(day_data.carb) if day_data and day_data.carb else 0,
                fat_g=float(day_data.fat) if day_data and day_data.fat else 0,
                avg_score=7.5 if day_data else 0, # Mocked score until we save it per meal
                weight=static_weight,
                target_calories=target_cals
            ))
    elif period == "monthly":
        # Group into 4 weeks roughly
        week_chunks = [
            (today - timedelta(days=29), today - timedelta(days=22)),
            (today - timedelta(days=21), today - timedelta(days=15)),
            (today - timedelta(days=14), today - timedelta(days=8)),
            (today - timedelta(days=7), today)
        ]
        
        for idx, (w_start, w_end) in enumerate(week_chunks):
            w_cals = w_pro = w_carb = w_fat = 0
            # Sum up the days that fall into this chunk
            for i in range((w_end - w_start).days + 1):
                d = w_start + timedelta(days=i)
                d_str = str(d)
                if d_str in data_by_day:
                    day_data = data_by_day[d_str]
                    w_cals += float(day_data.cal or 0)
                    w_pro += float(day_data.pro or 0)
                    w_carb += float(day_data.carb or 0)
                    w_fat += float(day_data.fat or 0)
                    
            # Averages for the week
            trend_data.append(TrendDataPoint(
                label=f"Week {idx+1}",
                calories=round(w_cals / 7, 1),
                protein_g=round(w_pro / 7, 1),
                carbs_g=round(w_carb / 7, 1),
                fat_g=round(w_fat / 7, 1),
                avg_score=7.5 if w_cals > 0 else 0,
                weight=static_weight,
                target_calories=target_cals
            ))
            
    return TrendAnalyticsResponse(period=period, data=trend_data)
