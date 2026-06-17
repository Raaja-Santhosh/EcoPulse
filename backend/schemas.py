"""
EcoPulse Schemas — Pydantic v2 Request/Response Models

Defines the data validation schemas for all API endpoints including
baseline quiz submissions, activity log CRUD operations, and the
AI-powered chatbot request/response cycle.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Literal
import uuid
from datetime import date


class BaselineQuiz(BaseModel):
    """Schema for the onboarding baseline carbon footprint quiz.

    Each field represents a user's lifestyle category. The backend uses
    these values to compute an annualized carbon footprint using certified
    emission coefficients.
    """

    transport_miles: float = Field(
        ..., description="Average weekly miles traveled", ge=0
    )
    transport_type: Literal["petrol", "EV", "transit", "none"] = Field(
        ..., description="Primary mode of transport"
    )
    diet_type: Literal["beef", "chicken", "veggie", "vegan"] = Field(
        ..., description="Primary diet category"
    )
    energy_kwh: float = Field(
        ..., description="Average monthly electricity usage in kWh", ge=0
    )
    waste_type: Literal["compost", "recycle", "landfill"] = Field(
        ..., description="Primary waste handling method"
    )

    @field_validator("transport_miles", "energy_kwh")
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        """Ensure numeric lifestyle inputs are non-negative."""
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v


class LogItem(BaseModel):
    """Schema representing a persisted activity log entry.

    Includes a unique ID, ISO date string, activity category, human-readable
    description, and the carbon impact value in kg CO2e.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str = Field(default_factory=lambda: date.today().isoformat())
    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str = Field(
        ..., max_length=5000, description="Human-readable description of the activity"
    )
    carbon_saved: float = Field(
        ...,
        description="Carbon footprint saved or emitted (positive = saved, negative = emitted) in kg CO2",
    )


class LogCreate(BaseModel):
    """Schema for creating a new activity log entry.

    Accepts a category, description, carbon impact value, and an optional
    ISO-format date string. If no date is provided, the current date is used.
    """

    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str = Field(
        ...,
        max_length=5000,
        description="Human-readable description of the activity",
    )
    carbon_saved: float = Field(
        ..., description="Carbon footprint saved or emitted in kg CO2"
    )
    date: Optional[str] = Field(
        default=None, description="Optional ISO-format date (YYYY-MM-DD)"
    )

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate that the optional date string is in ISO YYYY-MM-DD format."""
        if v is not None:
            try:
                date.fromisoformat(v)
            except ValueError:
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class ChatRequest(BaseModel):
    """Schema for incoming chatbot requests.

    Includes the user's message (max 1000 characters), optional conversation
    history, and optional baseline carbon context for personalized responses.
    """

    message: str = Field(
        ...,
        description="The message sent by the user to the chatbot",
        max_length=1000,
    )
    history: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Chat conversation history"
    )
    baseline_total: Optional[float] = Field(
        default=None,
        description="Total baseline carbon footprint in tons CO2e",
    )
    baseline_breakdown: Optional[Dict[str, float]] = Field(
        default=None,
        description="Breakdown of baseline footprint by category",
    )

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        """Strip whitespace and remove null bytes to prevent injection and encoding errors."""
        cleaned = v.strip().replace("\x00", "")
        if not cleaned:
            raise ValueError("Message cannot be empty or solely whitespace")
        return cleaned


class AutoLogDetails(BaseModel):
    """Schema for auto-logged activity details extracted from chat messages.

    When the Gemini model detects that a user mentioned performing a
    carbon-relevant activity, it returns these structured details for
    automatic logging.
    """

    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str
    carbon_saved: float


class ChatResponse(BaseModel):
    """Schema for outgoing chatbot responses.

    Contains the assistant's plain-text reply and optional auto-log details
    when the model extracts a carbon-relevant activity from the user's message.
    """

    reply: str = Field(
        ..., description="The plain-text response message from the chatbot"
    )
    auto_log: Optional[AutoLogDetails] = Field(
        default=None,
        description="Extracted activity log details if the user mentioned performing a carbon-relevant activity",
    )
