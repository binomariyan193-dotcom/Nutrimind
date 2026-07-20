import os
import json
import csv
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

# Load the ground truth dataset once at module initialization
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'healthy_foods_database.csv')
CSV_DATA = ""
if os.path.exists(CSV_PATH):
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        CSV_DATA = f.read()

class AIMealPlannerService:
    MODEL_NAME = "gemini-2.5-flash"

    @classmethod
    def generate_weekly_plan(cls, db: Session, user_id: str) -> WeeklyMealPlanResponse:
        """
        Generates a 7-day meal plan based on the user's health profile and medical history.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        if not CSV_DATA:
            raise HTTPException(status_code=500, detail="Ground truth dataset not found.")

        # Gather context
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == user_id).first()
        
        # Calculate Target Calories (TDEE)
        baselines = HealthAnalysisEngine.calculate_baselines(profile) if profile else {"tdee": 2000, "macros": {}}
        tdee = baselines.get("tdee", 2000)

        # Build context string
        context_str = f"Target Daily Calories: {tdee} kcal. "
        if profile:
            context_str += f"Health Goal: {profile.health_goal}. Activity Level: {profile.activity_level}. Dietary Preferences: {profile.dietary_preferences}. "
        if medical:
            context_str += f"Medical Conditions: {medical.conditions}. Allergies: {medical.allergies}. "

        try:
            model = genai.GenerativeModel(cls.MODEL_NAME)
            
            prompt = f"""
            You are a master AI Nutritionist. 
            Create a highly personalized, delicious 7-day meal plan for this user based on their specific profile and constraints.
            
            USER PROFILE:
            {context_str}

            CRITICAL DIRECTIVE: You MUST construct this meal plan STRICTLY using only food items from the provided GROUND TRUTH DATASET below. 
            Do NOT hallucinate food items. You must use the exact food_name as it appears in the dataset.
            The dataset values are per 100g. You must calculate the recommended portion size (e.g., "150g", "200g", "50g") and accurately scale the calories and protein_g based on the dataset's per-100g values.
            You must also include the health_score for each item exactly as it appears in the dataset.

            GROUND TRUTH DATASET (CSV FORMAT):
            {CSV_DATA}
            
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
                  "breakfast": {{ "name": "Exact food_name from dataset", "description": "string", "portion_size": "string (e.g., 150g)", "est_calories": 0, "protein_g": 0, "health_score": 0 }},
                  "lunch": {{ "name": "Exact food_name from dataset", "description": "string", "portion_size": "string", "est_calories": 0, "protein_g": 0, "health_score": 0 }},
                  "dinner": {{ "name": "Exact food_name from dataset", "description": "string", "portion_size": "string", "est_calories": 0, "protein_g": 0, "health_score": 0 }},
                  "snacks": [
                    {{ "name": "Exact food_name from dataset", "description": "string", "portion_size": "string", "est_calories": 0, "protein_g": 0, "health_score": 0 }}
                  ]
                }}
              ],
              "grocery_list": [
                {{
                  "category": "Vegetables",
                  "items": ["Exact food_name 1", "Exact food_name 2"]
                }},
                {{
                  "category": "Fruits",
                  "items": ["Exact food_name 3"]
                }}
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

