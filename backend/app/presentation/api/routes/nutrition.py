from fastapi import APIRouter, Depends, HTTPException
from app.presentation.schemas.nutrition import NutritionAnalysisRequest, NutritionAnalysisResponse
from app.application.services.nutrition_engine import NutritionEngine
from app.presentation.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/nutrition", tags=["Nutrition Engine"])

@router.post("/analyze", response_model=NutritionAnalysisResponse)
async def analyze_nutrition(
    request: NutritionAnalysisRequest,
    current_user = Depends(get_current_user)
):
    """
    Takes a list of detected food items and maps them against the USDA database 
    to calculate the complete nutritional profile.
    """
    try:
        # Pass the items to the NutritionEngine
        analysis = await NutritionEngine.analyze_items(request.items)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze nutrition: {str(e)}")
