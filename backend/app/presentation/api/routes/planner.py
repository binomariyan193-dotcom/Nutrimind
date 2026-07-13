from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.planner import WeeklyMealPlanResponse
from app.application.services.ai_planner import AIMealPlannerService

router = APIRouter(prefix="/planner", tags=["AI Meal Planner"])

@router.get("/generate", response_model=WeeklyMealPlanResponse)
async def generate_meal_plan(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized 7-day meal plan using Gemini AI based on the user's health profile and constraints.
    """
    try:
        plan = AIMealPlannerService.generate_weekly_plan(db=db, user_id=str(current_user.id))
        return plan
    except Exception as e:
        print(f"Meal Plan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")
