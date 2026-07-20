from pydantic import BaseModel, Field
from typing import List, Optional

class NutrientBreakdown(BaseModel):
    calories: float = 0.0
    protein_g: float = 0.0
    fat_g: float = 0.0
    carbs_g: float = 0.0
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0
    iron_mg: float = 0.0
    calcium_mg: float = 0.0
    vitamin_a_iu: float = 0.0
    vitamin_c_mg: float = 0.0
    vitamin_d_iu: float = 0.0
    health_score: float = 0.0

class DetectedItemInput(BaseModel):
    food_name: str
    estimated_weight_grams: float
    confidence_score: Optional[float] = None
    estimated_nutrients: Optional[NutrientBreakdown] = None

class NutritionAnalysisRequest(BaseModel):
    items: List[DetectedItemInput]

class AnalyzedFoodItem(BaseModel):
    original_name: str
    matched_name: Optional[str] = None
    fdc_id: Optional[int] = None
    weight_grams: float
    nutrients: NutrientBreakdown

class NutritionAnalysisResponse(BaseModel):
    total_nutrients: NutrientBreakdown
    items: List[AnalyzedFoodItem]

