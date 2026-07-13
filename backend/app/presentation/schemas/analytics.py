from pydantic import BaseModel
from typing import Optional, List

class MacroIntake(BaseModel):
    current: float
    goal: float
    percentage: float

class DailyHealthAnalysisResponse(BaseModel):
    date: str
    age: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    bmi: Optional[float]
    
    # Aggregated Scores
    avg_meal_score: float
    health_score: float
    daily_goal_completion_percentage: float
    
    # Macros
    calories: MacroIntake
    protein_g: MacroIntake
    carbs_g: MacroIntake
    fat_g: MacroIntake
    
    # Context
    active_medical_constraints: List[str]
    feedback: List[str]

class TrendDataPoint(BaseModel):
    label: str # e.g., 'Mon', 'Week 1'
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    avg_score: float = 0
    weight: Optional[float] = None
    target_calories: Optional[float] = None

class TrendAnalyticsResponse(BaseModel):
    period: str # 'weekly' or 'monthly'
    data: List[TrendDataPoint]
