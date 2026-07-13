from fastapi.testclient import TestClient

def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the NutriMind AI API!"}

def test_create_and_get_profile(client: TestClient):
    # Test POST /profile
    profile_data = {
        "age": 30,
        "gender": "male",
        "weight_kg": 75.0,
        "height_cm": 180.0,
        "activity_level": "moderate",
        "dietary_preferences": ["vegetarian"],
        "medical_conditions": [],
        "allergies": []
    }
    
    response = client.post("/profile", json=profile_data)
    assert response.status_code == 200
    data = response.json()
    assert data["age"] == 30
    assert data["activity_level"] == "moderate"
    
    # Test GET /profile
    response = client.get("/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["weight_kg"] == 75.0

def test_get_admin_stats(client: TestClient):
    # This endpoint aggregates across the DB, we expect empty/zero stats initially
    response = client.get("/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "meals_uploaded" in data
    assert type(data["meals_uploaded"]) == int
