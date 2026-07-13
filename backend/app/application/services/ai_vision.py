import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class FoodDetectionService:
    """
    Service for analyzing meal images using Google's Gemini Vision AI.
    It identifies food items, estimates serving sizes, and returns structured JSON.
    """
    
    # We use gemini-1.5-pro as it has excellent multimodal capabilities for detailed image analysis
    MODEL_NAME = "gemini-2.5-flash"

    @classmethod
    def detect_food(cls, image_bytes: bytes) -> dict:
        """
        Analyzes the given image bytes and returns a JSON dictionary of detected foods.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        try:
            model = genai.GenerativeModel(cls.MODEL_NAME)
            
            prompt = """
            You are an expert nutritionist and food recognition AI.
            Analyze the provided image and detect every single food item present on the plate or in the frame.
            For each item, estimate the serving size (weight in grams).
            Also, provide your best estimation of the nutritional breakdown for that estimated weight.
            Provide a confidence score between 0.0 and 1.0 for your detection.
            
            You MUST return the result EXCLUSIVELY as a valid JSON object. 
            Do not include markdown formatting like ```json or any other text before or after the JSON.
            
            The JSON structure must exactly match this format:
            {
              "items": [
                {
                  "food_name": "string (e.g. Grilled Chicken Breast)",
                  "estimated_weight_grams": number (e.g. 150),
                  "confidence_score": number (e.g. 0.92),
                  "estimated_nutrients": {
                    "calories": number,
                    "protein_g": number,
                    "carbs_g": number,
                    "fat_g": number,
                    "fiber_g": number,
                    "sugar_g": number,
                    "sodium_mg": number
                  }
                }
              ]
            }
            """
            
            # Construct the image part for Gemini
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
            
            response = model.generate_content([prompt, image_part])
            response_text = response.text.strip()
            
            # Clean up the response in case Gemini includes markdown code blocks despite instructions
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            # Parse the JSON string into a Python dictionary
            parsed_data = json.loads(response_text)
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response as JSON: {response_text}")
            raise HTTPException(status_code=500, detail="AI returned invalid data format.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Food detection failed: {str(e)}")
