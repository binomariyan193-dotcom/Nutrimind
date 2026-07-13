from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
import google.generativeai as genai
import os

from app.infrastructure.database.models import Notification, Meal, Nutrition, Profile
from app.application.services.health_analysis import HealthAnalysisEngine

class NotificationService:
    
    @staticmethod
    def evaluate_and_generate(db: Session, user_id: str):
        """
        Evaluates the user's current day metrics against their goals.
        Generates database notifications for alerts/reminders if they haven't been sent today.
        """
        today = date.today()
        now = datetime.now()
        
        # Get Profile and Baselines
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return
            
        baselines = HealthAnalysisEngine.calculate_baselines(profile)
        target_calories = baselines.get("tdee", 2000)
        target_protein = baselines.get("macros", {}).get("protein", 150)
        
        # Get today's meals
        today_meals = db.query(Meal).filter(Meal.user_id == user_id, func.date(Meal.timestamp) == today).all()
        meal_ids = [m.id for m in today_meals]
        
        # Aggregate nutrition
        total_cals = 0
        total_protein = 0
        if meal_ids:
            nutrition_logs = db.query(Nutrition).filter(Nutrition.meal_id.in_(meal_ids)).all()
            total_cals = sum(n.calories for n in nutrition_logs)
            total_protein = sum(n.protein_g for n in nutrition_logs)
            
        # Get existing notifications for today so we don't spam
        existing_alerts = db.query(Notification).filter(
            Notification.user_id == user_id,
            func.date(Notification.timestamp) == today
        ).all()
        existing_messages = [n.message for n in existing_alerts]
        
        new_notifications = []
        
        # Rule 1: Calories Exceeded
        msg_cal = f"You have exceeded your daily calorie target of {target_calories} kcal."
        if total_cals > target_calories and msg_cal not in existing_messages:
            new_notifications.append(Notification(user_id=user_id, notification_type="ALERT", message=msg_cal))
            
        # Rule 2: Protein Low (If after 5 PM and < 50% target)
        msg_pro = "You are low on protein today! Try adding a protein shake or lean meat to your next meal."
        if now.hour >= 17 and total_protein < (target_protein * 0.5) and msg_pro not in existing_messages:
            new_notifications.append(Notification(user_id=user_id, notification_type="ALERT", message=msg_pro))
            
        # Rule 3: Meal Skipped (e.g. no lunch by 3 PM)
        lunch_logged = any(m.meal_type and 'lunch' in m.meal_type.lower() for m in today_meals)
        msg_skip = "You haven't logged lunch yet. Don't skip meals to maintain steady energy!"
        if now.hour >= 15 and not lunch_logged and msg_skip not in existing_messages:
            new_notifications.append(Notification(user_id=user_id, notification_type="REMINDER", message=msg_skip))
            
        # Rule 4: Water Intake Low
        msg_water = "Stay hydrated! Have you drank enough water today?"
        if now.hour in [10, 14, 18] and msg_water not in existing_messages:
             new_notifications.append(Notification(user_id=user_id, notification_type="REMINDER", message=msg_water))
             
        # Rule 5: Healthy Reminder (AI Motivational - 1 per day)
        msg_prefix = "AI Tip:"
        has_ai_tip = any(msg.startswith(msg_prefix) for msg in existing_messages)
        if not has_ai_tip and now.hour >= 9:
            try:
                model = genai.GenerativeModel("gemini-1.5-pro")
                resp = model.generate_content("Give a short, punchy, 1-sentence highly motivational healthy eating tip. No intro/outro.")
                ai_tip = f"{msg_prefix} {resp.text.strip()}"
                new_notifications.append(Notification(user_id=user_id, notification_type="ACHIEVEMENT", message=ai_tip))
            except Exception:
                pass # Ignore Gemini failures in background

        # Save to DB
        if new_notifications:
            for n in new_notifications:
                db.add(n)
            db.commit()
