from pydantic import BaseModel
from typing import List
from app.presentation.schemas.nutrition import NutritionAnalysisResponse

class EngineeredFeatures(BaseModel):
    caloric_density: float # calories per gram
    protein_ratio: float   # % of calories from protein
    carb_ratio: float      # % of calories from carbs
    fat_ratio: float       # % of calories from fat
    fiber_to_carb_ratio: float

class MealHealthScore(BaseModel):
    score: float           # 1.0 to 10.0
    feedback: List[str]    # Positive and negative points

class PipelineResponse(BaseModel):
    meal_id: str
    image_url: str
    nutrition_analysis: NutritionAnalysisResponse
    features: EngineeredFeatures
    health_score: MealHealthScore
