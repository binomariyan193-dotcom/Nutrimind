from app.presentation.schemas.nutrition import NutritionAnalysisResponse
from app.presentation.schemas.pipeline import EngineeredFeatures

class FeatureEngineeringService:
    """
    Extracts derived nutritional metrics (features) used for health scoring.
    """

    @staticmethod
    def calculate_features(analysis: NutritionAnalysisResponse) -> EngineeredFeatures:
        nutrients = analysis.total_nutrients
        total_calories = nutrients.calories
        
        # Calculate total weight
        total_weight_g = sum([item.weight_grams for item in analysis.items])
        
        # 1. Caloric Density
        caloric_density = total_calories / total_weight_g if total_weight_g > 0 else 0.0
        
        # 2. Macro Ratios (% of total calories)
        # Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
        protein_cals = nutrients.protein_g * 4
        carb_cals = nutrients.carbs_g * 4
        fat_cals = nutrients.fat_g * 9
        
        # Calculate actual sum to get percentages (sometimes they don't exactly equal total calories)
        macro_cals_sum = protein_cals + carb_cals + fat_cals
        
        if macro_cals_sum > 0:
            protein_ratio = protein_cals / macro_cals_sum
            carb_ratio = carb_cals / macro_cals_sum
            fat_ratio = fat_cals / macro_cals_sum
        else:
            protein_ratio = carb_ratio = fat_ratio = 0.0
            
        # 3. Fiber to Carb Ratio
        fiber_to_carb = nutrients.fiber_g / nutrients.carbs_g if nutrients.carbs_g > 0 else 0.0
        
        return EngineeredFeatures(
            caloric_density=round(caloric_density, 2),
            protein_ratio=round(protein_ratio, 3),
            carb_ratio=round(carb_ratio, 3),
            fat_ratio=round(fat_ratio, 3),
            fiber_to_carb_ratio=round(fiber_to_carb, 3)
        )
