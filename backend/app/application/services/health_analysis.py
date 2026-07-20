from datetime import date as date_type, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.infrastructure.database.models import Profile, MedicalHistory, Meal, Nutrition, Analytic
from app.presentation.schemas.analytics import DailyHealthAnalysisResponse, MacroIntake

class HealthAnalysisEngine:
    
    # Activity Level Multipliers for TDEE calculation
    ACTIVITY_MULTIPLIERS = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "super_active": 1.9
    }

    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        if not weight_kg or not height_cm or height_cm == 0:
            return None
        height_m = height_cm / 100
        return round(weight_kg / (height_m * height_m), 1)

    @staticmethod
    def calculate_age(dob: date_type) -> int:
        if not dob:
            return None
        today = date_type.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @classmethod
    def calculate_baselines(cls, profile: Profile) -> dict:
        """
        Calculates BMR and TDEE (Daily Calorie Goal) using the Mifflin-St Jeor equation.
        Defaults to a standard 2000 kcal diet if profile data is missing.
        """
        DEFAULT_TDEE = 2000
        DEFAULT_MACROS = {"protein": 150, "carbs": 250, "fat": 65}
        
        if not profile.weight_kg or not profile.height_cm or not profile.dob or not profile.gender:
            return {"tdee": DEFAULT_TDEE, "macros": DEFAULT_MACROS}
            
        age = cls.calculate_age(profile.dob)
        
        # Mifflin-St Jeor
        if profile.gender.lower() == 'male':
            bmr = (10 * float(profile.weight_kg)) + (6.25 * float(profile.height_cm)) - (5 * age) + 5
        else:
            bmr = (10 * float(profile.weight_kg)) + (6.25 * float(profile.height_cm)) - (5 * age) - 161
            
        multiplier = cls.ACTIVITY_MULTIPLIERS.get(profile.activity_level, 1.2)
        tdee = bmr * multiplier
        
        # Standard balanced macro split: 30% Protein, 50% Carbs, 20% Fat
        macros = {
            "protein": (tdee * 0.30) / 4, # 4 kcal per gram of protein
            "carbs": (tdee * 0.50) / 4,   # 4 kcal per gram of carbs
            "fat": (tdee * 0.20) / 9      # 9 kcal per gram of fat
        }
        
        return {"tdee": round(tdee), "macros": {k: round(v) for k, v in macros.items()}}

    @staticmethod
    def get_daily_nutrition(db: Session, user_id: str, target_date: date_type) -> dict:
        """Aggregates all nutrition data for meals eaten on the target date."""
        # Join Meals and Nutrition, filter by user and date
        results = db.query(
            func.sum(Nutrition.calories).label('total_calories'),
            func.sum(Nutrition.protein_g).label('total_protein'),
            func.sum(Nutrition.carbs_g).label('total_carbs'),
            func.sum(Nutrition.fat_g).label('total_fat')
        ).join(Meal, Nutrition.meal_id == Meal.id).filter(
            Meal.user_id == user_id,
            func.date(Meal.timestamp) == target_date
        ).first()

        return {
            "calories": float(results.total_calories or 0.0),
            "protein": float(results.total_protein or 0.0),
            "carbs": float(results.total_carbs or 0.0),
            "fat": float(results.total_fat or 0.0)
        }

    @classmethod
    def generate_daily_analysis(cls, db: Session, user_id: str, target_date: date_type) -> DailyHealthAnalysisResponse:
        
        # 1. Fetch Profile and Medical History
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        medical = db.query(MedicalHistory).filter(MedicalHistory.user_id == user_id).first()
        
        # 2. Calculate Baselines
        baselines = cls.calculate_baselines(profile) if profile else {"tdee": 2000, "macros": {"protein": 150, "carbs": 250, "fat": 65}}
        
        # 3. Aggregate Daily Nutrition
        daily_nut = cls.get_daily_nutrition(db, user_id, target_date)
        
        # 4. Process Macros
        def build_macro(current, goal):
            pct = min((current / goal) * 100, 100) if goal > 0 else 0
            return MacroIntake(current=round(current, 1), goal=round(goal, 1), percentage=round(pct, 1))

        cal_intake = build_macro(daily_nut["calories"], baselines["tdee"])
        pro_intake = build_macro(daily_nut["protein"], baselines["macros"]["protein"])
        carb_intake = build_macro(daily_nut["carbs"], baselines["macros"]["carbs"])
        fat_intake = build_macro(daily_nut["fat"], baselines["macros"]["fat"])
        
        # Overall goal completion (average of the macro completions)
        goal_completion = (cal_intake.percentage + pro_intake.percentage + carb_intake.percentage + fat_intake.percentage) / 4.0
        
        # 5. Evaluate Medical Constraints & Generate Feedback
        feedback = []
        constraints = []
        health_score = 80.0 # Base score out of 100
        
        if medical and medical.conditions:
            conditions = [c.lower() for c in medical.conditions]
            if "diabetes" in conditions:
                constraints.append("Diabetic Sugar Monitoring")
                # Strict carb/sugar penalty heuristic
                if carb_intake.percentage > 110:
                    health_score -= 15
                    feedback.append("Carb intake is too high for diabetic profile.")
            
            if "hypertension" in conditions:
                constraints.append("Sodium Restriction")
                # Heuristic penalty
                feedback.append("Monitor sodium intake carefully due to hypertension.")
                
        # Basic Goal Feedback
        if cal_intake.percentage < 50:
            feedback.append("You are severely under your calorie goal today.")
            health_score -= 10
        elif cal_intake.percentage > 120:
            feedback.append("You have significantly exceeded your calorie goal.")
            health_score -= 10
            
        if pro_intake.percentage < 60:
            feedback.append("Try to eat more protein to hit your daily goal.")
            health_score -= 5

        # 6. Fetch Average Meal Score for the day (Mocked for now since we haven't stored it per meal yet)
        avg_meal_score = 7.5 # We would normally query an analytics table or calculate it live
        
        # Clamp health score
        health_score = max(0.0, min(100.0, round(health_score, 1)))
        
        if not feedback:
            feedback.append("You are perfectly on track with your goals today!")

        return DailyHealthAnalysisResponse(
            date=target_date.strftime("%Y-%m-%d"),
            age=cls.calculate_age(profile.dob) if profile else None,
            weight_kg=float(profile.weight_kg) if profile and profile.weight_kg else None,
            height_cm=float(profile.height_cm) if profile and profile.height_cm else None,
            bmi=cls.calculate_bmi(float(profile.weight_kg), float(profile.height_cm)) if profile and profile.weight_kg and profile.height_cm else None,
            avg_meal_score=avg_meal_score,
            health_score=health_score,
            daily_goal_completion_percentage=round(goal_completion, 1),
            calories=cal_intake,
            protein_g=pro_intake,
            carbs_g=carb_intake,
            fat_g=fat_intake,
            active_medical_constraints=constraints,
            feedback=feedback
        )

    @classmethod
    def evaluate_gamification(cls, db: Session, user_id: str) -> dict:
        """
        Evaluates and updates the user's gamification stats (streaks and badges).
        A successful day is defined as hitting within 10% of both calorie and protein targets.
        """
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return {"current_streak": 0, "longest_streak": 0, "last_goal_hit_date": None, "badges": []}

        today = date_type.today()
        from datetime import timedelta
        yesterday = today - timedelta(days=1)
        
        # We only evaluate yesterday if last_goal_hit_date is older than yesterday
        # If it's already yesterday or today, it was already evaluated or they hit it today.
        
        needs_evaluation = True
        if profile.last_goal_hit_date:
            if profile.last_goal_hit_date >= yesterday:
                needs_evaluation = False
            elif profile.last_goal_hit_date < yesterday:
                # They missed yesterday, streak resets to 0
                profile.current_streak = 0
                db.commit()
                needs_evaluation = True

        if needs_evaluation:
            # Check yesterday's nutrition
            baselines = cls.calculate_baselines(profile)
            yesterday_nut = cls.get_daily_nutrition(db, user_id, yesterday)
            
            cal_goal = baselines["tdee"]
            pro_goal = baselines["macros"]["protein"]
            
            cal_hit = (cal_goal * 0.9) <= yesterday_nut["calories"] <= (cal_goal * 1.1) if cal_goal else False
            pro_hit = (pro_goal * 0.9) <= yesterday_nut["protein"] <= (pro_goal * 1.1) if pro_goal else False
            
            if cal_hit and pro_hit:
                profile.current_streak += 1
                profile.last_goal_hit_date = yesterday
                if profile.current_streak > profile.longest_streak:
                    profile.longest_streak = profile.current_streak
                db.commit()

        # Check today just to see if they already hit it, which would increment it immediately
        # (Instead of waiting for tomorrow to check today)
        if profile.last_goal_hit_date != today:
            baselines = cls.calculate_baselines(profile)
            today_nut = cls.get_daily_nutrition(db, user_id, today)
            
            cal_goal = baselines["tdee"]
            pro_goal = baselines["macros"]["protein"]
            
            cal_hit = (cal_goal * 0.9) <= today_nut["calories"] <= (cal_goal * 1.1) if cal_goal else False
            pro_hit = (pro_goal * 0.9) <= today_nut["protein"] <= (pro_goal * 1.1) if pro_goal else False
            
            if cal_hit and pro_hit:
                profile.current_streak += 1
                profile.last_goal_hit_date = today
                if profile.current_streak > profile.longest_streak:
                    profile.longest_streak = profile.current_streak
                db.commit()

        # Assign Badges based on streaks
        badges = list(profile.badges) if profile.badges else []
        new_badges = []
        if profile.current_streak >= 3 and "3-Day Streak" not in badges:
            new_badges.append("3-Day Streak")
        if profile.current_streak >= 7 and "7-Day Streak" not in badges:
            new_badges.append("7-Day Streak")
        if profile.longest_streak >= 30 and "30-Day Streak" not in badges:
            new_badges.append("30-Day Streak")
            
        if new_badges:
            badges.extend(new_badges)
            profile.badges = badges
            db.commit()

        return {
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "last_goal_hit_date": str(profile.last_goal_hit_date) if profile.last_goal_hit_date else None,
            "badges": profile.badges or []
        }
