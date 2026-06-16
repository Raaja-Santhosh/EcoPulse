import os
import json
import pytest
import math
from unittest.mock import patch
from fastapi.testclient import TestClient
from pathlib import Path

# Set up test environment
import database
import schemas
from main import app

# Ensure database target is a test database
database.DB_FILE = Path(__file__).parent / "test_db_brutal.json"

@pytest.fixture(autouse=True)
def cleanup_test_db():
    # Setup: clean up/reset test DB
    if database.DB_FILE.exists():
        try:
            database.DB_FILE.unlink()
        except OSError:
            pass
    database.load_db()
    yield
    # Teardown: clean up test DB
    if database.DB_FILE.exists():
        try:
            database.DB_FILE.unlink()
        except OSError:
            pass

client = TestClient(app)

def test_negative_log_carbon_saved():
    # Negative carbon_saved signifies carbon emitted. We verify the XP calculation is robust (no crash, stays minimum 15)
    log_data = {
        "category": "transport",
        "description": "Heavy petrol emissions",
        "carbon_saved": -150.75
    }
    response = client.post("/api/logs", json=log_data)
    assert response.status_code == 200
    state = response.json()
    assert len(state["logs"]) == 1
    assert state["logs"][0]["carbon_saved"] == -150.75
    # Since carbon_saved is negative, it should not trigger the additional XP calculation.
    # Standard XP gained: 15. Initial XP was 0. So total XP = 15.
    assert state["xp"] == 15

def test_empty_and_invalid_categories():
    # Pydantic literals validation for category
    invalid_categories = ["", "invalid_category", "TRANSPORT", "diet ", None]
    for cat in invalid_categories:
        log_data = {
            "category": cat,
            "description": "Test category",
            "carbon_saved": 5.0
        }
        response = client.post("/api/logs", json=log_data)
        assert response.status_code == 422  # Unprocessable Entity

def test_massive_inputs():
    # 1. Massive numerical inputs in baseline quiz
    quiz_data = {
        "transport_miles": 1e20,
        "transport_type": "petrol",
        "diet_type": "beef",
        "energy_kwh": 1e20,
        "waste_type": "landfill"
    }
    response = client.post("/api/baseline", json=quiz_data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["baseline"]["calculations"]["total"] > 1e19
    assert res_data["xp"] == 50

    # 2. Massive text length for description in log
    massive_desc = "X" * 500000
    log_data = {
        "category": "other",
        "description": massive_desc,
        "carbon_saved": 12.34
    }
    response = client.post("/api/logs", json=log_data)
    assert response.status_code == 200
    state = response.json()
    assert len(state["logs"]) == 1
    assert len(state["logs"][0]["description"]) == 500000

def test_nan_parameters():
    # 1. NaN in baseline
    quiz_data = {
        "transport_miles": "NaN",
        "transport_type": "petrol",
        "diet_type": "beef",
        "energy_kwh": 200.0,
        "waste_type": "landfill"
    }
    response = client.post("/api/baseline", json=quiz_data)
    # "NaN" as string gets parsed to float by Pydantic.
    # However, NaN fails the ge=0 validation check, resulting in a 422 validation error.
    assert response.status_code == 422

    # 2. NaN in carbon_saved of logs.
    log_data = {
        "category": "other",
        "description": "NaN test log",
        "carbon_saved": "NaN"
    }
    # The logs category does not have a ge=0 constraint, so Pydantic parses "NaN" to float('nan').
    # However, standard JSON serialization does not support NaN and raises ValueError in Python.
    try:
        response = client.post("/api/logs", json=log_data)
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            state = response.json()
            assert len(state["logs"]) == 1
            val = state["logs"][0]["carbon_saved"]
            assert val is None or math.isnan(val)
    except ValueError as e:
        assert "JSON compliant" in str(e) or "Out of range float values" in str(e)

def test_type_mismatches():
    # 1. String instead of float for transport_miles
    quiz_data_bad = {
        "transport_miles": "five hundred",
        "transport_type": "petrol",
        "diet_type": "beef",
        "energy_kwh": 200.0,
        "waste_type": "landfill"
    }
    response = client.post("/api/baseline", json=quiz_data_bad)
    assert response.status_code == 422

    # 2. Array instead of string for description
    log_data_bad = {
        "category": "diet",
        "description": ["Vegan salad", "and juice"],
        "carbon_saved": 1.5
    }
    response = client.post("/api/logs", json=log_data_bad)
    assert response.status_code == 422

    # 3. Object instead of float for carbon_saved
    log_data_bad2 = {
        "category": "energy",
        "description": "Turned off lights",
        "carbon_saved": {"value": 2.5}
    }
    response = client.post("/api/logs", json=log_data_bad2)
    assert response.status_code == 422

def test_gemini_connection_failure():
    # Mock get_gemini_model to prevent real Google Generative AI validation or connection
    with patch("main.get_gemini_model") as mock_get_model:
        mock_model = mock_get_model.return_value
        mock_model.generate_content.side_effect = Exception("API connection failure: DNS resolution timed out")
        
        chat_payload = {"message": "I rode my bicycle today"}
        response = client.post(
            "/api/chat",
            json=chat_payload,
            headers={"X-Gemini-API-Key": "test_api_key_123"}
        )
        # Verify it raises a 500 error due to Gemini exception handling
        assert response.status_code == 500
        assert "Gemini generation error" in response.json()["detail"]
