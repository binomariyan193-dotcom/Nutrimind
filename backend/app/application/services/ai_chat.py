import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.infrastructure.database.models import Profile, MedicalHistory, Meal, Nutrition

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AIChatService:
    MODEL_NAME = "gemini-2.5-flash"

    @classmethod
    def ask_question(cls, db: Session, user_id: str, question: str) -> str:
        """
        Builds the context prompt and calls Gemini to answer a specific user query.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        # Gather context
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == user_id).first()
        
        # We also grab nutrition from today just in case they ask about daily limits
        from datetime import datetime, time
        today_start = datetime.combine(datetime.now().date(), time.min)
        meals_data = db.query(Nutrition).join(Meal, Nutrition.meal_id == Meal.id)\
                       .filter(Meal.user_id == user_id, Meal.timestamp >= today_start).all()
                       
        total_cals = sum(m.calories for m in meals_data)
        total_pro = sum(m.protein_g for m in meals_data)

        # Build context strings
        context_str = f"User Profile: "
        if profile:
            context_str += f"Weight {profile.weight_kg}kg, Goal: {profile.health_goal}, Diet: {profile.diet_preference}. "
        if medical:
            context_str += f"Conditions: {medical.conditions}, Allergies: {medical.food_allergies}. "
            
        context_str += f"Nutrition logged today: {round(total_cals)} kcal, {round(total_pro)}g protein."

        try:
            model = genai.GenerativeModel(cls.MODEL_NAME)
            
            prompt = f"""
            You are NutriMind AI, a friendly, expert AI Nutritionist. 
            Keep your answers concise, actionable, and extremely helpful. Do not use overly long paragraphs.

            Context about the user asking the question:
            {context_str}
            
            User's Question: "{question}"
            
            Answer the user directly based on their specific health profile and context. Use markdown formatting to make the answer highly readable (bullet points, bold text).
            """
            
            response = model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Chat failed: {str(e)}")
