import os
import httpx
from typing import List, Dict, Any
from app.presentation.schemas.nutrition import DetectedItemInput, AnalyzedFoodItem, NutrientBreakdown, NutritionAnalysisResponse
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

USDA_API_KEY = os.environ.get("USDA_API_KEY", "DEMO_KEY")
USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Mapping of our requested nutrient fields to USDA Nutrient IDs
NUTRIENT_MAP = {
    "calories": [1008, 2047, 2048], # Energy
    "protein_g": [1003],            # Protein
    "fat_g": [1004],                # Total lipid (fat)
    "carbs_g": [1005],              # Carbohydrate, by difference
    "fiber_g": [1079],              # Fiber, total dietary
    "sugar_g": [2000, 1063],        # Sugars, total
    "sodium_mg": [1093],            # Sodium, Na
    "iron_mg": [1089],              # Iron, Fe
    "calcium_mg": [1087],           # Calcium, Ca
    "vitamin_a_iu": [1100, 1104],   # Vitamin A, IU or RAE
    "vitamin_c_mg": [1162],         # Vitamin C, total ascorbic acid
    "vitamin_d_iu": [1110, 1114]    # Vitamin D (D2 + D3)
}

class NutritionEngine:
    
    @staticmethod
    async def search_food(client: httpx.AsyncClient, food_name: str) -> Dict[str, Any]:
        """Searches for the closest matching food item in the USDA database."""
        try:
            response = await client.get(
                f"{USDA_BASE_URL}/foods/search",
                params={
                    "api_key": USDA_API_KEY,
                    "query": food_name,
                    "pageSize": 1,
                    "dataType": "Foundation,SR Legacy,Survey (FNDDS),Branded" # Broaden search for prepared foods
                }
            )
            response.raise_for_status()
            data = response.json()
            if data.get("foods") and len(data["foods"]) > 0:
                return data["foods"][0]
            return None
        except httpx.HTTPStatusError as e:
            print(f"USDA API Error: {e.response.text}")
            return None
        except Exception as e:
            print(f"Search Food Error: {str(e)}")
            return None

    @staticmethod
    def extract_nutrients(food_data: Dict[str, Any], weight_grams: float) -> NutrientBreakdown:
        """Extracts and scales nutrients based on the actual weight (USDA returns values per 100g)."""
        scale_factor = weight_grams / 100.0
        breakdown = NutrientBreakdown()
        
        if not food_data or "foodNutrients" not in food_data:
            return breakdown
            
        for nutrient in food_data["foodNutrients"]:
            n_id = nutrient.get("nutrientId")
            amount = nutrient.get("value", 0.0)
            
            if amount is None:
                amount = 0.0
                
            scaled_amount = amount * scale_factor
            
            # Map the USDA ID to our NutrientBreakdown schema
            for key, ids in NUTRIENT_MAP.items():
                if n_id in ids:
                    # Some nutrients might have multiple matching IDs (like Energy in kcal vs kJ)
                    # We prefer the first one we find that gives a value. 
                    # Note: A more robust implementation would strictly check unit names (e.g. kcal).
                    current_val = getattr(breakdown, key)
                    if current_val == 0.0:
                        setattr(breakdown, key, round(scaled_amount, 2))
                        
        return breakdown

    @classmethod
    async def analyze_items(cls, items: List[DetectedItemInput]) -> NutritionAnalysisResponse:
        """Processes a list of detected food items and returns the comprehensive analysis."""
        
        if USDA_API_KEY == "DEMO_KEY":
            print("WARNING: Using USDA DEMO_KEY. Rate limits apply.")
            
        analyzed_items = []
        total_breakdown = NutrientBreakdown()
        
        import asyncio
        async with httpx.AsyncClient() as client:
            for i, item in enumerate(items):
                if i > 0:
                    # USDA API limit is 1,000 requests/hour (3.6s per request)
                    await asyncio.sleep(3.6)
                    
                # 1. Search USDA Database
                food_data = await cls.search_food(client, item.food_name)
                
                # 2. Extract and scale nutrients
                nutrients = NutrientBreakdown()
                matched_name = None
                fdc_id = None
                
                if food_data:
                    matched_name = food_data.get("description")
                    fdc_id = food_data.get("fdcId")
                    nutrients = cls.extract_nutrients(food_data, item.estimated_weight_grams)
                    if nutrients.calories == 0.0 and item.estimated_nutrients:
                        nutrients = item.estimated_nutrients
                        matched_name = f"AI Estimated ({item.food_name}) - Sparse USDA Data"
                elif item.estimated_nutrients:
                    nutrients = item.estimated_nutrients
                    matched_name = f"AI Estimated ({item.food_name})"
                    
                # 3. Create Analyzed Item
                analyzed_item = AnalyzedFoodItem(
                    original_name=item.food_name,
                    matched_name=matched_name,
                    fdc_id=fdc_id,
                    weight_grams=item.estimated_weight_grams,
                    nutrients=nutrients
                )
                analyzed_items.append(analyzed_item)
                
                # 4. Accumulate Totals
                for key in total_breakdown.model_dump().keys():
                    current_total = getattr(total_breakdown, key)
                    item_val = getattr(nutrients, key)
                    setattr(total_breakdown, key, round(current_total + item_val, 2))
                    
        return NutritionAnalysisResponse(
            total_nutrients=total_breakdown,
            items=analyzed_items
        )
