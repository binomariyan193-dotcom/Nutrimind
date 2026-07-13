from unittest.mock import patch, MagicMock
from app.application.services.food_detection import FoodDetectionService
from app.application.services.ai_planner import AIMealPlannerService
from app.infrastructure.database.models import Profile

@patch("google.generativeai.GenerativeModel.generate_content")
def test_food_detection_service(mock_generate):
    # Mock the Gemini API response
    mock_response = MagicMock()
    mock_response.text = '''
    {
      "foods": [
        {
          "food_name": "Grilled Chicken",
          "estimated_weight_g": 200,
          "confidence": 0.95
        }
      ]
    }
    '''
    mock_generate.return_value = mock_response
    
    # Run the service (using a dummy byte string as an image)
    dummy_image_bytes = b"dummy_image_data"
    result = FoodDetectionService.detect_food(dummy_image_bytes)
    
    # Validate the Pydantic schema parsing
    assert len(result.foods) == 1
    assert result.foods[0].food_name == "Grilled Chicken"
    assert result.foods[0].estimated_weight_g == 200
    
@patch("google.generativeai.GenerativeModel.generate_content")
def test_ai_meal_planner_service(mock_generate):
    # Mock the Gemini API response
    mock_response = MagicMock()
    mock_response.text = '''
    {
      "plan_title": "Test Plan",
      "weekly_target_calories": 2000,
      "days": [
        {
          "day": 1,
          "breakfast": { "name": "Eggs", "description": "Scrambled", "est_calories": 250, "protein_g": 15 },
          "lunch": { "name": "Salad", "description": "Chicken", "est_calories": 400, "protein_g": 30 },
          "dinner": { "name": "Fish", "description": "Salmon", "est_calories": 500, "protein_g": 35 },
          "snacks": []
        }
      ],
      "grocery_list": []
    }
    '''
    mock_generate.return_value = mock_response
    
    # Create a dummy profile
    profile = Profile(weight_kg=70, height_cm=175, age=30, gender="male", activity_level="sedentary")
    
    # Run the service
    result = AIMealPlannerService.generate_plan(profile, None)
    
    # Validate the Pydantic schema parsing
    assert result.plan_title == "Test Plan"
    assert len(result.days) == 1
    assert result.days[0].breakfast.name == "Eggs"
    assert result.days[0].lunch.protein_g == 30
