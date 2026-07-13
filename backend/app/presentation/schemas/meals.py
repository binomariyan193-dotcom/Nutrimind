from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DetectedFoodSchema(BaseModel):
    food_name: str
    confidence_score: Optional[float] = None

class NutritionSchema(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float

class MealHistoryItem(BaseModel):
    id: int
    timestamp: datetime
    meal_type: str
    description: Optional[str]
    image_url: Optional[str]
    nutrition: Optional[NutritionSchema]
    detected_foods: List[DetectedFoodSchema]
    
class MealHistoryResponse(BaseModel):
    meals: List[MealHistoryItem]
    total_count: int
