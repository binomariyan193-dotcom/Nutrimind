from pydantic import BaseModel
from typing import List

class AIRecommendationResponse(BaseModel):
    meal_summary: str
    healthy_alternatives: List[str]
    exercise_suggestion: str
    next_meal_suggestion: str
    motivational_advice: str
