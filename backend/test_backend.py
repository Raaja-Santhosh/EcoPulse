import os
import json
import pytest
from fastapi.testclient import TestClient
from pathlib import Path

# Set up test environment
import database
import schemas
from main import app

# Ensure database target is a test database
database.DB_FILE = Path(__file__).parent / "test_db.json"

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

def test_database_initialization():
    state = database.get_state()
    assert state["baseline"] is None
    assert state["logs"] == []
    assert state["xp"] == 0
    assert state["streak"] == 0
    assert state["last_active"] is None

def test_baseline_calculation_and_saving():
    quiz_data = {
        "transport_miles": 100.0,
        "transport_type": "petrol",
        "diet_type": "beef",
        "energy_kwh": 200.0,
        "waste_type": "landfill"
    }
    
    # 100 * 0.411 = 41.1
    # beef = 7.2
    # 200 * 0.385 = 77.0
    # landfill = 1.5
    # total = 41.1 + 7.2 + 77.0 + 1.5 = 126.8
    
    response = client.post("/api/baseline", json=quiz_data)
    assert response.status_code == 200
    res_data = response.json()
    
    # Check calculations
    calculations = res_data["baseline"]["calculations"]
    assert calculations["transport"] == 41.1
    assert calculations["diet"] == 7.2
    assert calculations["energy"] == 77.0
    assert calculations["waste"] == 1.5
    assert calculations["total"] == 126.8
    
    # Gamification checks (Completing baseline assessment gives 50 XP)
    assert res_data["xp"] == 50
    assert res_data["streak"] == 1
    assert res_data["last_active"] is not None

def test_logs_crud_operations():
    # 1. Add log
    log_data = {
        "category": "transport",
        "description": "Biked to work",
        "carbon_saved": 4.11
    }
    
    response = client.post("/api/logs", json=log_data)
    assert response.status_code == 200
    state = response.json()
    
    # Check log added
    assert len(state["logs"]) == 1
    log_item = state["logs"][0]
    assert log_item["category"] == "transport"
    assert log_item["description"] == "Biked to work"
    assert log_item["carbon_saved"] == 4.11
    
    # XP should be 15 base + int(4.11 * 10) = 15 + 41 = 56 XP
    assert state["xp"] == 56
    assert state["streak"] == 1
    
    # 2. Get logs
    get_response = client.get("/api/logs")
    assert get_response.status_code == 200
    logs = get_response.json()
    assert len(logs) == 1
    
    # 3. Delete log via path
    log_id = log_item["id"]
    delete_response = client.delete(f"/api/logs/{log_id}")
    assert delete_response.status_code == 200
    state_after_delete = delete_response.json()
    assert len(state_after_delete["logs"]) == 0
    
    # 4. Add another log and delete via query parameter
    response2 = client.post("/api/logs", json=log_data)
    log_id2 = response2.json()["logs"][0]["id"]
    
    delete_query_response = client.delete(f"/api/logs?id={log_id2}")
    assert delete_query_response.status_code == 200
    state_after_delete2 = delete_query_response.json()
    assert len(state_after_delete2["logs"]) == 0

def test_chat_missing_api_key():
    chat_payload = {
        "message": "What is my carbon footprint?"
    }
    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 400
    assert "Google Gemini API Key is missing" in response.json()["detail"]
