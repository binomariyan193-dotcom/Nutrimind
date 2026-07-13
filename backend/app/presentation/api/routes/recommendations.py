from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.recommendations import AIRecommendationResponse
from app.application.services.ai_recommendations import AIRecommendationService

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])

@router.get("/daily", response_model=AIRecommendationResponse)
async def get_daily_recommendations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates personalized nutrition and lifestyle recommendations using Gemini AI.
    It analyzes the user's profile, medical history, and recent meals to provide actionable insights.
    """
    try:
        recommendations = AIRecommendationService.generate_recommendations(db=db, user_id=str(current_user.id))
        return recommendations
    except Exception as e:
        print(f"AI Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")
