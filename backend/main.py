import os
import uuid
import json
from datetime import date
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pydantic import BaseModel

import database
from schemas import BaselineQuiz, LogItem, LogCreate, ChatRequest, ChatResponse, AutoLogDetails

app = FastAPI(
    title="EcoPulse Backend",
    description="FastAPI Backend for EcoPulse carbon footprint and behavioral tracking application.",
    version="1.0.0"
)

# CORS middleware to allow the frontend to interact with the backend
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.environ.get("FRONTEND_URL", "")
]
# Remove any empty values
allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to configure and retrieve the Gemini GenerativeModel
def get_gemini_model(api_key: str, model_name: str = "gemini-2.0-flash-lite") -> genai.GenerativeModel:
    genai.configure(api_key=api_key)
    
    gemini_schema = {
        "type": "object",
        "properties": {
            "reply": {"type": "string"},
            "auto_log": {
                "type": "object",
                "nullable": True,
                "properties": {
                    "category": {"type": "string"},
                    "description": {"type": "string"},
                    "carbon_saved": {"type": "number"}
                }
            }
        },
        "required": ["reply"]
    }
    
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": gemini_schema
        }
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to EcoPulse API. Backend is running!"}

@app.get("/api/state")
def get_current_state():
    """Retrieve the complete user state including baseline, logs, XP, and streak."""
    try:
        return database.get_state()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load state: {str(e)}"
        )

@app.post("/api/baseline")
def save_baseline_quiz(quiz: BaselineQuiz):
    """
    Saves baseline calculations using the specified carbon formulas:
    - transport: petrol = miles*0.411, EV = miles*0.12, transit = miles*0.08, none = 0.0
    - diet: beef = 7.2, chicken = 2.4, veggie = 1.1, vegan = 0.5
    - energy: kwh * 0.385
    - waste: compost = -0.5, recycle = -0.3, landfill = 1.5
    """
    try:
        # Calculate Transport emissions
        transport_factor = 0.0
        if quiz.transport_type == "petrol":
            transport_factor = 0.411
        elif quiz.transport_type == "EV":
            transport_factor = 0.12
        elif quiz.transport_type == "transit":
            transport_factor = 0.08
        
        transport_calc = round(quiz.transport_miles * transport_factor, 2)

        # Calculate Diet emissions
        diet_calc = 0.0
        if quiz.diet_type == "beef":
            diet_calc = 7.2
        elif quiz.diet_type == "chicken":
            diet_calc = 2.4
        elif quiz.diet_type == "veggie":
            diet_calc = 1.1
        elif quiz.diet_type == "vegan":
            diet_calc = 0.5

        # Calculate Energy emissions
        energy_calc = round(quiz.energy_kwh * 0.385, 2)

        # Calculate Waste emissions
        waste_calc = 0.0
        if quiz.waste_type == "compost":
            waste_calc = -0.5
        elif quiz.waste_type == "recycle":
            waste_calc = -0.3
        elif quiz.waste_type == "landfill":
            waste_calc = 1.5

        total_footprint = round(transport_calc + diet_calc + energy_calc + waste_calc, 2)

        calculations = {
            "transport": transport_calc,
            "diet": diet_calc,
            "energy": energy_calc,
            "waste": waste_calc,
            "total": total_footprint
        }

        baseline_data = quiz.model_dump()
        updated_state = database.save_baseline(baseline_data, calculations)
        return updated_state

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate and save baseline: {str(e)}"
        )

@app.get("/api/logs")
def get_logs():
    """Retrieve all log entries from the database."""
    try:
        return database.get_logs()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve logs: {str(e)}"
        )

@app.post("/api/logs")
def create_log(log_in: LogCreate):
    """Create a new activity log entry and award gamification XP/streak updates."""
    try:
        log_id = str(uuid.uuid4())
        log_date = log_in.date or date.today().isoformat()
        
        log_item = {
            "id": log_id,
            "date": log_date,
            "category": log_in.category,
            "description": log_in.description,
            "carbon_saved": log_in.carbon_saved
        }
        
        updated_state = database.add_log(log_item)
        return updated_state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create log entry: {str(e)}"
        )

@app.delete("/api/logs/{log_id}")
def delete_log_path(log_id: str):
    """Delete a log entry by its ID via path parameter."""
    try:
        updated_state = database.delete_log(log_id)
        return updated_state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log entry: {str(e)}"
        )

@app.delete("/api/logs")
def delete_log_query(id: str = Query(..., description="The ID of the log entry to delete")):
    """Delete a log entry by its ID via query parameter."""
    try:
        updated_state = database.delete_log(id)
        return updated_state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log entry: {str(e)}"
        )

# Chatbot handler logic
def handle_chat_logic(chat_req: ChatRequest, api_key: str):
    # Build system/prompt context
    current_state = database.get_state()
    baseline = current_state.get("baseline")
    
    score_context = ""
    if baseline and "calculations" in baseline:
        score_context = (
            f"The user has a baseline annual carbon footprint of {baseline['calculations']['total']} tons of CO2e. "
            f"Breakdown: Transport: {baseline['calculations']['transport']} tons, Diet: {baseline['calculations']['diet']} tons, "
            f"Energy: {baseline['calculations']['energy']} tons, Waste: {baseline['calculations']['waste']} tons."
        )
    else:
        score_context = "The user has not completed their baseline assessment yet."

    prompt_context = f"""
System context:
You are EcoPulse Assistant, a personal carbon intelligence coach.
Your job is to reply to the user's message and extract any carbon-impact activities they have performed to automatically log them.
{score_context}

Strict Scope, Length & Formatting Rules:
1. You must ONLY answer questions, provide tips, or discuss topics related to carbon footprints, environmental sustainability, ecology, climate change, and green living.
2. If the user's message is not related to carbon footprint, sustainability, ecology, or green living, you must politely decline to answer in the "reply" field, explaining that your expertise is strictly limited to carbon footprint tracking and ecological sustainability. Do not answer their unrelated question.
3. Keep the "reply" extremely short, brief, and directly on point (maximum 2 to 3 sentences, under 50 words).
4. Do NOT use any Markdown symbols, formatting characters, asterisks (**), hashtags (#), or dashes/bullet points in the "reply" field. Output clean, plain text only.

Rules for response:
1. Return a JSON object matching this schema:
   {{
     "reply": "your response (plain text only, no markdown symbols)",
     "auto_log": null or {{
       "category": "transport" | "diet" | "energy" | "waste" | "other",
       "description": "Short description of the activity done",
       "carbon_saved": float
     }}
   }}
2. Tailor your reply to the user's current carbon footprint score if provided.
3. If the user describes doing a specific activity (within the allowed eco scope), set "auto_log" to the extracted details. Otherwise, set "auto_log" to null.
4. Calculate "carbon_saved" in kg CO2 using these exact formulas:
   - Transport:
     * Petrol car commute: carbon_saved = -(miles * 0.411)
     * EV commute: carbon_saved = -(miles * 0.12)  (or if they drove EV instead of petrol: (0.411 - 0.12) * miles)
     * Public transit commute: carbon_saved = -(miles * 0.08) (or if transit instead of petrol: (0.411 - 0.08) * miles)
     * Biking/Walking instead of petrol car: carbon_saved = miles * 0.411
   - Diet:
     * Eating beef: carbon_saved = -7.2 per serving
     * Eating chicken/poultry/fish: carbon_saved = -2.4 per serving
     * Eating veggie: carbon_saved = -1.1 per serving (or if veggie instead of beef: 6.1 per serving)
     * Eating vegan: carbon_saved = -0.5 per serving (or if vegan instead of beef: 6.7 per serving)
   - Energy:
     * Consuming electricity: carbon_saved = -(kwh * 0.385)
     * Saving electricity: carbon_saved = kwh * 0.385
   - Waste:
     * Composting: carbon_saved = 0.5
     * Recycling: carbon_saved = 0.3
     * Landfill waste: carbon_saved = -1.5
   - Other:
     * Estimate a reasonable carbon_saved value (positive for savings, negative for emissions) in kg CO2.

User message: "{chat_req.message}"
"""

    models_to_try = [
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-8b-latest",
        "gemini-1.5-flash-latest"
    ]

    response = None
    last_err = None
    for model_name in models_to_try:
        try:
            model = get_gemini_model(api_key, model_name=model_name)
            response = model.generate_content(prompt_context)
            break
        except Exception as e:
            last_err = e
            print(f"Backend failed using model {model_name}: {str(e)}")
            continue

    if not response:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini generation error: {str(last_err)}"
        )
    try:
        # Parse the structured JSON response
        response_text = response.text.strip()
        result_json = json.loads(response_text)
        
        reply = result_json.get("reply", "")
        auto_log = result_json.get("auto_log")
        
        # If the model automatically extracted an activity log, save it to the local database
        saved_auto_log = None
        if auto_log:
            log_id = str(uuid.uuid4())
            log_item = {
                "id": log_id,
                "date": date.today().isoformat(),
                "category": auto_log.get("category", "other"),
                "description": auto_log.get("description", "Auto-logged activity"),
                "carbon_saved": float(auto_log.get("carbon_saved", 0.0))
            }
            database.add_log(log_item)
            saved_auto_log = AutoLogDetails(
                category=log_item["category"],
                description=log_item["description"],
                carbon_saved=log_item["carbon_saved"]
            )
            
        return ChatResponse(
            reply=reply,
            auto_log=saved_auto_log
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini returned an invalid JSON response structure: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini generation error: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(
    chat_req: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """
    Chatbot endpoint. Calls the Gemini API with structured JSON output forcing 
    the response to include a reply and auto_log.
    API Key is resolved from the header 'X-Gemini-API-Key' or 'GEMINI_API_KEY' environment variable.
    """
    api_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Gemini API Key is missing. Provide it in the X-Gemini-API-Key header or set it as a GEMINI_API_KEY environment variable."
        )
    return handle_chat_logic(chat_req, api_key)

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint_alias(
    chat_req: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    """Alias for /chat to match either frontend endpoint variation."""
    api_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Gemini API Key is missing. Provide it in the X-Gemini-API-Key header or set it as a GEMINI_API_KEY environment variable."
        )
    return handle_chat_logic(chat_req, api_key)
