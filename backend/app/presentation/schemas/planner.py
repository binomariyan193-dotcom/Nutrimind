from pydantic import BaseModel
from typing import List

class MealIdea(BaseModel):
    name: str
    description: str
    est_calories: int
    protein_g: int

class DailyPlan(BaseModel):
    day: int
    breakfast: MealIdea
    lunch: MealIdea
    dinner: MealIdea
    snacks: List[MealIdea]

class GroceryCategory(BaseModel):
    category: str
    items: List[str]

class WeeklyMealPlanResponse(BaseModel):
    plan_title: str
    weekly_target_calories: int
    days: List[DailyPlan]
    grocery_list: List[GroceryCategory]
