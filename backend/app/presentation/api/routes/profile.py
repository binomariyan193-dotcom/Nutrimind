from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.profile import HealthProfileUpdate, HealthProfileResponse
from app.infrastructure.database.models import Profile, MedicalHistory, User

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/health", response_model=HealthProfileResponse)
def get_health_profile(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user exists in our DB (they might only exist in Supabase if webhook isn't set up yet)
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        # Create user record
        db_user = User(id=current_user.id, email=current_user.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    profile = db.query(Profile).filter(Profile.user_id == db_user.id).first()
    medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == db_user.id).first()

    response_data = {"user_id": str(db_user.id)}
    
    if profile:
        response_data.update({
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "dob": profile.dob,
            "gender": profile.gender,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "activity_level": profile.activity_level,
            "dietary_preferences": profile.dietary_preferences,
            "health_goal": profile.health_goal,
            "exercise_frequency": profile.exercise_frequency,
            "sleep_hours": profile.sleep_hours,
            "water_intake_liters": profile.water_intake_liters,
        })
        
    if medical:
        response_data.update({
            "medical_conditions": medical.conditions,
            "food_allergies": medical.allergies,
        })

    return HealthProfileResponse(**response_data)

@router.put("/health", response_model=HealthProfileResponse)
def update_health_profile(
    profile_data: HealthProfileUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        db_user = User(id=current_user.id, email=current_user.email)
        db.add(db_user)
        db.commit()

    # Upsert Profile
    profile = db.query(Profile).filter(Profile.user_id == db_user.id).first()
    if not profile:
        profile = Profile(user_id=db_user.id)
        db.add(profile)
    
    # Update Profile fields
    profile.first_name = profile_data.first_name
    profile.last_name = profile_data.last_name
    profile.dob = profile_data.dob
    profile.gender = profile_data.gender
    profile.height_cm = profile_data.height_cm
    profile.weight_kg = profile_data.weight_kg
    profile.activity_level = profile_data.activity_level
    profile.dietary_preferences = profile_data.dietary_preferences
    profile.health_goal = profile_data.health_goal
    profile.exercise_frequency = profile_data.exercise_frequency
    profile.sleep_hours = profile_data.sleep_hours
    profile.water_intake_liters = profile_data.water_intake_liters

    # Upsert Medical History
    medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == db_user.id).first()
    if not medical:
        medical = MedicalHistory(user_id=db_user.id)
        db.add(medical)
        
    medical.conditions = profile_data.medical_conditions
    medical.allergies = profile_data.food_allergies

    db.commit()
    db.refresh(profile)
    db.refresh(medical)

    return get_health_profile(current_user=current_user, db=db)
