"""
EcoPulse Backend — FastAPI Application

This module provides the REST API for the EcoPulse carbon footprint tracking
and behavioral awareness platform. It includes endpoints for baseline carbon
footprint calculation, activity log CRUD operations, and an AI-powered
chatbot using Google Gemini with structured JSON output.
"""

import os
import re
import uuid
import json
import logging
from datetime import date
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Header, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import google.generativeai as genai
from pydantic import BaseModel

import database
from schemas import BaselineQuiz, LogItem, LogCreate, ChatRequest, ChatResponse, AutoLogDetails

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ecopulse.backend")

# ---------------------------------------------------------------------------
# Carbon emission coefficients (single source of truth for the backend)
# ---------------------------------------------------------------------------
TRANSPORT_COEFFICIENTS: Dict[str, float] = {
    "petrol": 0.411,   # kg CO2 per mile
    "EV": 0.12,        # kg CO2 per mile
    "transit": 0.08,   # kg CO2 per mile
    "none": 0.0,
}

DIET_COEFFICIENTS: Dict[str, float] = {
    "beef": 7.2,       # kg CO2 per serving
    "chicken": 2.4,    # kg CO2 per serving
    "veggie": 1.1,     # kg CO2 per serving
    "vegan": 0.5,      # kg CO2 per serving
}

WASTE_COEFFICIENTS: Dict[str, float] = {
    "compost": -0.5,   # kg CO2 saved
    "recycle": -0.3,   # kg CO2 saved
    "landfill": 1.5,   # kg CO2 emitted
}

ENERGY_COEFFICIENT: float = 0.385  # kg CO2e per kWh

# ---------------------------------------------------------------------------
# Application Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="EcoPulse Backend",
    description="FastAPI Backend for EcoPulse carbon footprint and behavioral tracking application.",
    version="1.0.0",
)

# CORS middleware to allow the frontend to interact with the backend
allowed_origins: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
# Append FRONTEND_URL from env if provided
_frontend_url = os.environ.get("FRONTEND_URL", "")
if _frontend_url:
    allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,  # Frontend does not send cookies/credentials
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject secure HTTP headers to prevent Clickjacking, MIME sniffing, XSS, and iframe injection."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    return response


# ---------------------------------------------------------------------------
# Simple in-memory rate limiter for the chat endpoint
# ---------------------------------------------------------------------------
_chat_rate_store: Dict[str, List[float]] = {}
CHAT_RATE_LIMIT = 20          # max requests
CHAT_RATE_WINDOW_SECS = 60    # per time window

def _check_rate_limit(identifier: str) -> bool:
    """Return True if the request should be allowed, False if rate-limited."""
    import time
    now = time.time()
    window_start = now - CHAT_RATE_WINDOW_SECS
    timestamps = _chat_rate_store.get(identifier, [])
    # Prune old entries
    timestamps = [t for t in timestamps if t > window_start]
    if len(timestamps) >= CHAT_RATE_LIMIT:
        _chat_rate_store[identifier] = timestamps
        return False
    timestamps.append(now)
    _chat_rate_store[identifier] = timestamps
    return True


# ---------------------------------------------------------------------------
# Gemini Model Helper
# ---------------------------------------------------------------------------
def get_gemini_model(
    api_key: str,
    model_name: str = "gemini-2.0-flash-lite",
    system_instruction: Optional[str] = None,
) -> genai.GenerativeModel:
    """Configure the Google Generative AI SDK and return a GenerativeModel instance.

    Args:
        api_key: The Gemini API key.
        model_name: Which Gemini model to use.
        system_instruction: Optional system-level instruction for the model.

    Returns:
        A configured ``GenerativeModel`` ready to call ``generate_content``.
    """
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
                    "carbon_saved": {"type": "number"},
                },
            },
        },
        "required": ["reply"],
    }

    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": gemini_schema,
        },
    )


# ---------------------------------------------------------------------------
# Health-Check Endpoint
# ---------------------------------------------------------------------------
@app.get("/")
def read_root() -> Dict[str, str]:
    """Health-check endpoint returning a welcome message."""
    return {"message": "Welcome to EcoPulse API. Backend is running!"}


# ---------------------------------------------------------------------------
# State Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/state")
def get_current_state() -> Dict[str, Any]:
    """Retrieve the complete user state including baseline, logs, XP, and streak."""
    try:
        return database.get_state()
    except Exception as exc:
        logger.exception("Failed to load application state")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load state: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Baseline Quiz Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/baseline")
def save_baseline_quiz(quiz: BaselineQuiz) -> Dict[str, Any]:
    """Save baseline calculations using certified carbon formulas.

    Transport: petrol = miles*0.411, EV = miles*0.12, transit = miles*0.08, none = 0.0
    Diet:      beef = 7.2, chicken = 2.4, veggie = 1.1, vegan = 0.5
    Energy:    kwh * 0.385
    Waste:     compost = -0.5, recycle = -0.3, landfill = 1.5
    """
    try:
        transport_factor = TRANSPORT_COEFFICIENTS.get(quiz.transport_type, 0.0)
        transport_calc = round(quiz.transport_miles * transport_factor, 2)

        diet_calc = DIET_COEFFICIENTS.get(quiz.diet_type, 0.0)

        energy_calc = round(quiz.energy_kwh * ENERGY_COEFFICIENT, 2)

        waste_calc = WASTE_COEFFICIENTS.get(quiz.waste_type, 0.0)

        total_footprint = round(transport_calc + diet_calc + energy_calc + waste_calc, 2)

        calculations = {
            "transport": transport_calc,
            "diet": diet_calc,
            "energy": energy_calc,
            "waste": waste_calc,
            "total": total_footprint,
        }

        baseline_data = quiz.model_dump()
        updated_state = database.save_baseline(baseline_data, calculations)
        logger.info("Baseline saved: total=%.2f tons CO2e", total_footprint)
        return updated_state

    except Exception as exc:
        logger.exception("Failed to calculate and save baseline")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate and save baseline: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Log CRUD Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/logs")
def get_logs() -> List[Dict[str, Any]]:
    """Retrieve all log entries from the database."""
    try:
        return database.get_logs()
    except Exception as exc:
        logger.exception("Failed to retrieve logs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve logs: {str(exc)}",
        )


@app.post("/api/logs")
def create_log(log_in: LogCreate) -> Dict[str, Any]:
    """Create a new activity log entry and award gamification XP/streak updates."""
    try:
        log_id = str(uuid.uuid4())
        log_date = log_in.date or date.today().isoformat()

        log_item = {
            "id": log_id,
            "date": log_date,
            "category": log_in.category,
            "description": log_in.description,
            "carbon_saved": log_in.carbon_saved,
        }

        updated_state = database.add_log(log_item)
        logger.info("Log created: id=%s category=%s carbon_saved=%.2f", log_id, log_in.category, log_in.carbon_saved)
        return updated_state
    except Exception as exc:
        logger.exception("Failed to create log entry")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create log entry: {str(exc)}",
        )


@app.delete("/api/logs/{log_id}")
def delete_log_path(log_id: str) -> Dict[str, Any]:
    """Delete a log entry by its ID via path parameter."""
    try:
        updated_state = database.delete_log(log_id)
        logger.info("Log deleted via path: id=%s", log_id)
        return updated_state
    except Exception as exc:
        logger.exception("Failed to delete log entry")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log entry: {str(exc)}",
        )


@app.delete("/api/logs")
def delete_log_query(id: str = Query(..., description="The ID of the log entry to delete")) -> Dict[str, Any]:
    """Delete a log entry by its ID via query parameter."""
    try:
        updated_state = database.delete_log(id)
        logger.info("Log deleted via query: id=%s", id)
        return updated_state
    except Exception as exc:
        logger.exception("Failed to delete log entry")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log entry: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Chat Logic (Shared Handler)
# ---------------------------------------------------------------------------
def _build_system_instruction(chat_req: ChatRequest) -> str:
    """Build the Gemini system instruction incorporating the user's live carbon context."""
    try:
        current_state = database.get_state()
        baseline = current_state.get("baseline")
    except Exception as exc:
        logger.exception("Failed to load application state for chat context")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load application state: {str(exc)}",
        )

    score_context = ""
    if chat_req.baseline_total is not None:
        breakdown = chat_req.baseline_breakdown or {}
        score_context = (
            f"The user has a baseline annual carbon footprint of {chat_req.baseline_total} tons of CO2e. "
            f"Breakdown: Transport: {breakdown.get('transport', 0.0)} tons, Diet: {breakdown.get('diet', 0.0)} tons, "
            f"Energy: {breakdown.get('energy', 0.0)} tons, Waste: {breakdown.get('waste', 0.0)} tons."
        )
    elif baseline and "calculations" in baseline:
        calcs = baseline["calculations"]
        score_context = (
            f"The user has a baseline annual carbon footprint of {calcs['total']} tons of CO2e. "
            f"Breakdown: Transport: {calcs['transport']} tons, Diet: {calcs['diet']} tons, "
            f"Energy: {calcs['energy']} tons, Waste: {calcs['waste']} tons."
        )
    else:
        score_context = "The user has not completed their baseline assessment yet."

    return f"""You are EcoPulse Assistant, a personal carbon intelligence coach.
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
"""


def handle_chat_logic(chat_req: ChatRequest, api_key: str) -> ChatResponse:
    """Process a chat request: discover models, generate a response, and optionally auto-log activities.

    Args:
        chat_req: The validated chat request payload.
        api_key: The Gemini API key to use.

    Returns:
        A ``ChatResponse`` with the assistant's reply and optional auto-log details.

    Raises:
        HTTPException: On Gemini API failure or invalid response format.
    """
    system_instruction = _build_system_instruction(chat_req)

    # Configure genai with the API key first to list models
    genai.configure(api_key=api_key)

    models_to_try: List[str] = []
    try:
        api_models = genai.list_models()
        # Filter models that support generateContent and strip any "models/" prefix
        available_names = [
            m.name.replace("models/", "")
            for m in api_models
            if "generateContent" in m.supported_generation_methods
        ]

        # Priority groups (lowest traffic → highest traffic):
        # 1. 'lite'    — lowest traffic, highest free tier rate limits
        # 2. '8b'      — lightweight, low traffic
        # 3. 'preview' — newer experimental previews
        # 4. 'flash'   — standard flash, medium traffic
        # 5. 'pro'     — heavy traffic, lowest rate limits (last resort)
        priority_patterns = ["lite", "8b", "preview", "flash", "pro"]

        def get_model_priority(model_name: str) -> int:
            name_lower = model_name.lower()
            for idx, pattern in enumerate(priority_patterns):
                if pattern in name_lower:
                    return idx
            return len(priority_patterns)

        models_to_try = sorted(available_names, key=get_model_priority)
        logger.info("Discovered %d models, prioritized: %s", len(available_names), models_to_try[:5])
    except Exception as exc:
        logger.warning("Failed to discover models dynamically: %s — using fallback list", exc)
        models_to_try = [
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ]

    if not models_to_try:
        models_to_try = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"]

    response = None
    last_err: Optional[Exception] = None
    for model_name in models_to_try:
        try:
            model = get_gemini_model(api_key, model_name=model_name, system_instruction=system_instruction)
            response = model.generate_content(chat_req.message)
            logger.info("Successfully generated response with model: %s", model_name)
            break
        except Exception as exc:
            last_err = exc
            logger.warning("Model %s failed: %s", model_name, exc)
            continue

    if not response:
        logger.error("All models exhausted. Last error: %s", last_err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini generation error: {str(last_err)}",
        )

    try:
        # Parse the structured JSON response
        response_text = response.text.strip()
        result_json = json.loads(response_text)

        reply = result_json.get("reply", "")
        auto_log = result_json.get("auto_log")

        # If the model automatically extracted an activity log, save it to the local database
        saved_auto_log: Optional[AutoLogDetails] = None
        if auto_log:
            log_id = str(uuid.uuid4())
            log_item = {
                "id": log_id,
                "date": date.today().isoformat(),
                "category": auto_log.get("category", "other"),
                "description": auto_log.get("description", "Auto-logged activity"),
                "carbon_saved": float(auto_log.get("carbon_saved", 0.0)),
            }
            database.add_log(log_item)
            saved_auto_log = AutoLogDetails(
                category=log_item["category"],
                description=log_item["description"],
                carbon_saved=log_item["carbon_saved"],
            )
            logger.info("Auto-logged activity: %s (%.2f kg CO2)", log_item["description"], log_item["carbon_saved"])

        return ChatResponse(
            reply=reply,
            auto_log=saved_auto_log,
        )

    except json.JSONDecodeError as exc:
        logger.error("Gemini returned invalid JSON: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini returned an invalid JSON response structure: {str(exc)}",
        )
    except Exception as exc:
        logger.exception("Unexpected error processing Gemini response")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini generation error: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Chat Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(
    chat_req: ChatRequest,
    request: Request,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
) -> ChatResponse:
    """Chatbot endpoint. Calls the Gemini API with structured JSON output forcing
    the response to include a reply and optional auto_log.

    API Key is resolved from the header 'X-Gemini-API-Key' or 'GEMINI_API_KEY' environment variable.
    """
    api_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Gemini API Key is missing. Provide it in the X-Gemini-API-Key header or set it as a GEMINI_API_KEY environment variable.",
        )
    api_key = api_key.strip()

    # Basic rate limiting keyed by the first 8 chars of the API key
    rate_key = api_key[:8] if len(api_key) >= 8 else api_key
    if not _check_rate_limit(rate_key):
        logger.warning("Rate limit exceeded for key prefix: %s***", rate_key[:4])
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {CHAT_RATE_LIMIT} requests per {CHAT_RATE_WINDOW_SECS} seconds.",
        )

    try:
        return handle_chat_logic(chat_req, api_key)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during chat processing")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during chat processing: {str(exc)}",
        )


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint_alias(
    chat_req: ChatRequest,
    request: Request,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
) -> ChatResponse:
    """Alias for /chat — delegates to the canonical /api/chat handler."""
    return chat_endpoint(chat_req, request, x_gemini_api_key)
