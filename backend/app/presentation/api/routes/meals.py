import uuid
from typing import Optional
from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.infrastructure.external.supabase_client import supabase
from app.infrastructure.database.models import Meal, MealImage, User, Nutrition, DetectedFood
from app.application.services.image_preprocessing import ImagePreprocessingService
from app.presentation.schemas.meals import MealHistoryResponse, MealHistoryItem, NutritionSchema, DetectedFoodSchema

router = APIRouter(prefix="/meals", tags=["Meals"])

@router.get("/history", response_model=MealHistoryResponse)
async def get_meal_history(
    start_date: Optional[date_type] = None,
    end_date: Optional[date_type] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the user's meal history with images and nutrition details, supporting date filtering and pagination.
    """
    query = db.query(Meal).filter(Meal.user_id == str(current_user.id))
    
    if start_date:
        query = query.filter(func.date(Meal.timestamp) >= start_date)
    if end_date:
        query = query.filter(func.date(Meal.timestamp) <= end_date)
        
    total_count = query.count()
    
    # Order by newest first
    meals = query.order_by(desc(Meal.timestamp)).offset(offset).limit(limit).all()
    
    history_items = []
    for meal in meals:
        # Get Image
        meal_image = db.query(MealImage).filter(MealImage.meal_id == meal.id).first()
        image_url = meal_image.image_url if meal_image else None
        
        # Get Nutrition
        nut = db.query(Nutrition).filter(Nutrition.meal_id == meal.id).first()
        nutrition_data = None
        if nut:
            nutrition_data = NutritionSchema(
                calories=nut.calories,
                protein_g=nut.protein_g,
                carbs_g=nut.carbs_g,
                fat_g=nut.fat_g,
                fiber_g=nut.fiber_g,
                sugar_g=nut.sugar_g,
                sodium_mg=nut.sodium_mg
            )
            
        # Get Detected Foods
        detected = db.query(DetectedFood).filter(
            meal_image and DetectedFood.meal_image_id == meal_image.id
        ).all() if meal_image else []
        
        foods = [DetectedFoodSchema(food_name=f.food_name, confidence_score=f.confidence_score) for f in detected]
        
        history_items.append(MealHistoryItem(
            id=meal.id,
            timestamp=meal.timestamp,
            meal_type=meal.meal_type,
            description=meal.description,
            image_url=image_url,
            nutrition=nutrition_data,
            detected_foods=foods
        ))
        
    return MealHistoryResponse(meals=history_items, total_count=total_count)

@router.post("/upload")
async def upload_meal_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user exists in our DB
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        db_user = User(id=current_user.id, email=current_user.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # 1. Generate unique filename (always jpg now due to preprocessing)
    unique_filename = f"{current_user.id}/{uuid.uuid4()}.jpg"

    try:
        # Read file content
        file_bytes = await file.read()
        
        # Preprocess the image (Validate, Resize, Enhance, Compress, Strip Metadata)
        processed_bytes = ImagePreprocessingService.process_image(file_bytes)
        
        # 2. Upload to Supabase Storage
        # Note: Requires a bucket named 'meal_images' to exist and be public
        res = supabase.storage.from_('meal_images').upload(
            path=unique_filename, 
            file=processed_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        
        # 3. Get public URL
        public_url = supabase.storage.from_('meal_images').get_public_url(unique_filename)
        
        # 4. Create preliminary Meal record
        # We assume it's an 'uncategorized' meal until user provides more info
        new_meal = Meal(
            user_id=db_user.id,
            meal_type="uncategorized",
            description="Pending AI Analysis..."
        )
        db.add(new_meal)
        db.commit()
        db.refresh(new_meal)
        
        # 5. Create MealImage record
        new_image = MealImage(
            meal_id=new_meal.id,
            image_url=public_url
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        
        return {
            "message": "Image uploaded successfully",
            "meal_id": str(new_meal.id),
            "image_url": public_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
