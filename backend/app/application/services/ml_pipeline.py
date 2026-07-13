import uuid
from typing import List
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.infrastructure.external.supabase_client import supabase
from app.infrastructure.database.models import Meal, MealImage, DetectedFood, Nutrition

from app.application.services.image_preprocessing import ImagePreprocessingService
from app.application.services.ai_vision import FoodDetectionService
from app.application.services.nutrition_engine import NutritionEngine
from app.application.services.feature_engineering import FeatureEngineeringService
from app.application.services.health_scoring import HealthScoringService

from app.presentation.schemas.nutrition import DetectedItemInput
from app.presentation.schemas.pipeline import PipelineResponse

class MLPipeline:
    """
    Master orchestrator for the NutriMind AI Machine Learning Pipeline.
    """

    @staticmethod
    async def process_meal_image(file: UploadFile, user_id: str, db: Session) -> PipelineResponse:
        
        # 1. Read Raw Bytes
        raw_bytes = await file.read()
        
        # 2. Image Preprocessing (Validate, Resize, Enhance, Compress)
        processed_bytes = ImagePreprocessingService.process_image(raw_bytes)
        
        # 3. Upload to Supabase Storage
        unique_filename = f"{user_id}/{uuid.uuid4()}.jpg"
        supabase.storage.from_('meal_images').upload(
            path=unique_filename, 
            file=processed_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        image_url = supabase.storage.from_('meal_images').get_public_url(unique_filename)
        
        # 4. Food Detection (Gemini AI Vision)
        detection_result = FoodDetectionService.detect_food(processed_bytes)
        
        # Parse AI JSON into input schemas for the Nutrition Engine
        detected_items: List[DetectedItemInput] = []
        for item in detection_result.get("items", []):
            detected_items.append(DetectedItemInput(**item))
            
        # 5. Nutrition Mapping (USDA Engine)
        nutrition_analysis = await NutritionEngine.analyze_items(detected_items)
        
        # 6. Feature Engineering (Derived Metrics)
        features = FeatureEngineeringService.calculate_features(nutrition_analysis)
        
        # 7. Health Scoring (Algorithmic Heuristics)
        health_score = HealthScoringService.calculate_score(nutrition_analysis, features)
        
        # 8. Database Persistence
        # A. Create Meal
        meal = Meal(
            user_id=user_id,
            meal_type="uncategorized",
            description=", ".join([item.food_name for item in detected_items])
        )
        db.add(meal)
        db.commit()
        db.refresh(meal)
        
        # B. Create Meal Image
        meal_image = MealImage(meal_id=meal.id, image_url=image_url)
        db.add(meal_image)
        db.commit()
        db.refresh(meal_image)
        
        # C. Save Detected Foods
        for item in detected_items:
            df = DetectedFood(
                meal_image_id=meal_image.id,
                food_name=item.food_name,
                confidence_score=item.confidence_score
            )
            db.add(df)
            
        # D. Save Nutrition
        nutrients = nutrition_analysis.total_nutrients
        meal_nutrition = Nutrition(
            meal_id=meal.id,
            calories=nutrients.calories,
            protein_g=nutrients.protein_g,
            carbs_g=nutrients.carbs_g,
            fat_g=nutrients.fat_g,
            fiber_g=nutrients.fiber_g,
            sugar_g=nutrients.sugar_g,
            sodium_mg=nutrients.sodium_mg
        )
        db.add(meal_nutrition)
        
        # Also save the health score to an Analytic record or just commit everything
        db.commit()
        
        return PipelineResponse(
            meal_id=str(meal.id),
            image_url=image_url,
            nutrition_analysis=nutrition_analysis,
            features=features,
            health_score=health_score
        )
