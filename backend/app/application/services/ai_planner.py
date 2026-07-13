import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Profile, MedicalHistory
from app.application.services.health_analysis import HealthAnalysisEngine
from app.presentation.schemas.planner import WeeklyMealPlanResponse

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AIMealPlannerService:
    MODEL_NAME = "gemini-2.5-flash"

    @classmethod
    def generate_weekly_plan(cls, db: Session, user_id: str) -> WeeklyMealPlanResponse:
        """
        Generates a 7-day meal plan based on the user's health profile and medical history.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        # Gather context
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == user_id).first()
        
        # Calculate Target Calories (TDEE)
        baselines = HealthAnalysisEngine.calculate_baselines(profile) if profile else {"tdee": 2000, "macros": {}}
        tdee = baselines.get("tdee", 2000)

        # Build context string
        context_str = f"Target Daily Calories: {tdee} kcal. "
        if profile:
            context_str += f"Health Goal: {profile.health_goal}. Activity Level: {profile.activity_level}. Diet Preference: {profile.diet_preference}. "
        if medical:
            context_str += f"Medical Conditions: {medical.conditions}. Allergies: {medical.food_allergies}. "

        try:
            model = genai.GenerativeModel(cls.MODEL_NAME)
            
            prompt = f"""
            You are a master AI Nutritionist. 
            Create a highly personalized, delicious 7-day meal plan for this user based on their specific profile and constraints.
            
            USER PROFILE:
            {context_str}

            For each of the 7 days, provide a Breakfast, Lunch, Dinner, and a list of Snacks. 
            Ensure the total daily calories roughly equals their target of {tdee} kcal, and adhere strictly to any diet preferences or medical conditions/allergies.
            
            After generating the 7 days of meals, you must extract all necessary ingredients and generate a comprehensive Grocery List.
            Group the grocery list into exactly these categories: "Vegetables", "Fruits", "Grains", "Protein", "Dairy", "Other".
            
            You MUST return the result EXCLUSIVELY as a valid JSON object. 
            Do not include markdown formatting like ```json or any other text before or after the JSON.
            
            The JSON structure must exactly match this format:
            {{
              "plan_title": "String summarizing the plan (e.g., High-Protein Keto Plan)",
              "weekly_target_calories": {tdee},
              "days": [
                {{
                  "day": 1,
                  "breakfast": {{ "name": "string", "description": "string", "est_calories": 0, "protein_g": 0 }},
                  "lunch": {{ "name": "string", "description": "string", "est_calories": 0, "protein_g": 0 }},
                  "dinner": {{ "name": "string", "description": "string", "est_calories": 0, "protein_g": 0 }},
                  "snacks": [
                    {{ "name": "string", "description": "string", "est_calories": 0, "protein_g": 0 }}
                  ]
                }}
                // ... repeat up to day 7
              ],
              "grocery_list": [
                {{
                  "category": "Vegetables",
                  "items": ["Spinach", "Broccoli", "Carrots"]
                }},
                {{
                  "category": "Fruits",
                  "items": ["Apples", "Bananas"]
                }},
                // ... continue for Grains, Protein, Dairy, Other
              ]
            }}
            """
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up response
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            parsed_data = json.loads(response_text)
            return WeeklyMealPlanResponse(**parsed_data)
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response as JSON: {response_text}")
            raise HTTPException(status_code=500, detail="AI returned invalid data format for the meal plan.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Meal Plan generation failed: {str(e)}")
