from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class HealthProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    dietary_preferences: Optional[List[str]] = None
    health_goal: Optional[str] = None
    exercise_frequency: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    
    # Medical History fields
    medical_conditions: Optional[List[str]] = None
    food_allergies: Optional[List[str]] = None

class HealthProfileResponse(HealthProfileUpdate):
    user_id: str
