from app.presentation.schemas.nutrition import NutritionAnalysisResponse
from app.presentation.schemas.pipeline import EngineeredFeatures, MealHealthScore

class HealthScoringService:
    """
    Evaluates the nutritional profile and engineered features to generate a Health Score (1-10)
    based on standard dietary guidelines.
    """

    @staticmethod
    def calculate_score(nutrition: NutritionAnalysisResponse, features: EngineeredFeatures) -> MealHealthScore:
        score = 7.0  # Base score
        feedback = []
        
        nutrients = nutrition.total_nutrients

        # 1. Caloric Density Penalty
        if features.caloric_density > 2.5: # e.g. junk food, heavily processed
            score -= 1.5
            feedback.append("High caloric density. Consider adding more vegetables or water-rich foods.")
        elif features.caloric_density < 1.0: # e.g. salads, soups
            score += 1.0
            feedback.append("Excellent low caloric density. Very satiating.")

        # 2. Protein Check
        if features.protein_ratio > 0.25: # >25% protein
            score += 1.0
            feedback.append("Great source of protein!")
        elif features.protein_ratio < 0.10 and nutrients.calories > 200:
            score -= 0.5
            feedback.append("Consider adding more protein for better satiety.")

        # 3. Fiber Check
        if nutrients.fiber_g >= 10:
            score += 1.0
            feedback.append("Excellent fiber content!")
        elif nutrients.fiber_g < 3 and nutrients.carbs_g > 30:
            score -= 1.0
            feedback.append("High in carbs but low in fiber. Try swapping to whole grains.")
            
        # 4. Sugar Penalty
        if nutrients.sugar_g > 20:
            score -= 1.5
            feedback.append("High in sugar.")
            
        # 5. Sodium Penalty
        if nutrients.sodium_mg > 800:
            score -= 1.0
            feedback.append("High sodium content.")

        # 6. Micronutrient Bonuses
        micronutrient_bonus = 0
        if nutrients.iron_mg > 3: micronutrient_bonus += 0.2
        if nutrients.calcium_mg > 200: micronutrient_bonus += 0.2
        if nutrients.vitamin_c_mg > 30: micronutrient_bonus += 0.2
        if micronutrient_bonus > 0:
            score += micronutrient_bonus
            feedback.append("Good source of essential micronutrients.")

        # Clamp score between 1.0 and 10.0
        final_score = max(1.0, min(10.0, round(score, 1)))

        if not feedback:
            feedback.append("A generally balanced meal.")

        return MealHealthScore(
            score=final_score,
            feedback=feedback
        )
