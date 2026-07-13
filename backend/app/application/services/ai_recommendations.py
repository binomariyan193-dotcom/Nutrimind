import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.infrastructure.database.models import Profile, MedicalHistory, Meal, Nutrition
from app.presentation.schemas.recommendations import AIRecommendationResponse

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AIRecommendationService:
    """
    Acts as a personalized AI Nutritionist using Gemini 1.5 Pro.
    """
    MODEL_NAME = "gemini-2.5-flash"

    @classmethod
    def get_user_context(cls, db: Session, user_id: str) -> dict:
        """Gathers the user's profile, medical history, and recent meals for context."""
        
        # 1. Profile
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        profile_data = {}
        if profile:
            profile_data = {
                "age_approx": datetime.now().year - profile.dob.year if profile.dob else "Unknown",
                "weight_kg": profile.weight_kg,
                "height_cm": profile.height_cm,
                "gender": profile.gender,
                "activity_level": profile.activity_level,
                "diet_preference": profile.diet_preference,
                "health_goal": profile.health_goal
            }
            
        # 2. Medical History
        medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == user_id).first()
        medical_data = {}
        if medical:
            medical_data = {
                "conditions": medical.conditions,
                "allergies": medical.food_allergies
            }
            
        # 3. Recent Meals (Last 48 hours)
        two_days_ago = datetime.now() - timedelta(days=2)
        meals = db.query(Meal).filter(
            Meal.user_id == user_id,
            Meal.timestamp >= two_days_ago
        ).order_by(Meal.timestamp.desc()).all()
        
        recent_meals = []
        for meal in meals:
            nut = db.query(Nutrition).filter(Nutrition.meal_id == meal.id).first()
            recent_meals.append({
                "description": meal.description,
                "calories": nut.calories if nut else 0,
                "protein_g": nut.protein_g if nut else 0,
                "carbs_g": nut.carbs_g if nut else 0,
                "fat_g": nut.fat_g if nut else 0
            })

        return {
            "profile": profile_data,
            "medical_history": medical_data,
            "recent_meals": recent_meals
        }

    @classmethod
    def generate_recommendations(cls, db: Session, user_id: str) -> AIRecommendationResponse:
        """
        Builds the context prompt and calls Gemini to generate personalized recommendations.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        context = cls.get_user_context(db, user_id)
        
        try:
            model = genai.GenerativeModel(cls.MODEL_NAME)
            
            prompt = f"""
            You are an expert AI Nutritionist and Health Coach. 
            Analyze the user's data and provide personalized, actionable advice.

            USER CONTEXT:
            Profile: {json.dumps(context['profile'])}
            Medical Conditions & Allergies: {json.dumps(context['medical_history'])}
            Recent Meals (Last 48hrs): {json.dumps(context['recent_meals'])}
            
            Based on this information, generate the following insights:
            1. Meal Summary: Briefly analyze their recent eating patterns.
            2. Healthy Alternatives: Suggest 2-3 specific healthy food swaps based on their recent meals.
            3. Exercise Suggestion: Recommend a daily activity suited to their profile and goals.
            4. Next Meal Suggestion: Suggest a concrete, specific meal they should eat next to balance their macros.
            5. Motivational Advice: A short, encouraging message to keep them on track.

            You MUST return the result EXCLUSIVELY as a valid JSON object. 
            Do not include markdown formatting like ```json or any other text before or after the JSON.
            
            The JSON structure must exactly match this format:
            {{
              "meal_summary": "string",
              "healthy_alternatives": ["string", "string"],
              "exercise_suggestion": "string",
              "next_meal_suggestion": "string",
              "motivational_advice": "string"
            }}
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up the response
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            # Parse and return as Pydantic model
            parsed_data = json.loads(response_text)
            return AIRecommendationResponse(**parsed_data)
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response as JSON: {response_text}")
            raise HTTPException(status_code=500, detail="AI returned invalid data format.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")
