from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Literal
import uuid
from datetime import date

class BaselineQuiz(BaseModel):
    transport_miles: float = Field(..., description="Average weekly miles traveled", ge=0)
    transport_type: Literal["petrol", "EV", "transit", "none"] = Field(..., description="Primary mode of transport")
    diet_type: Literal["beef", "chicken", "veggie", "vegan"] = Field(..., description="Primary diet category")
    energy_kwh: float = Field(..., description="Average monthly electricity usage in kWh", ge=0)
    waste_type: Literal["compost", "recycle", "landfill"] = Field(..., description="Primary waste handling method")

    @field_validator("transport_miles", "energy_kwh")
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v

class LogItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str = Field(default_factory=lambda: date.today().isoformat())
    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str
    carbon_saved: float = Field(..., description="Carbon footprint saved or emitted (positive = saved, negative = emitted) in kg CO2")

class LogCreate(BaseModel):
    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str
    carbon_saved: float = Field(..., description="Carbon footprint saved or emitted in kg CO2")
    date: Optional[str] = None

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                date.fromisoformat(v)
            except ValueError:
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v

class ChatRequest(BaseModel):
    message: str = Field(..., description="The message sent by the user to the chatbot")
    history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Chat conversation history")

class AutoLogDetails(BaseModel):
    category: Literal["transport", "diet", "energy", "waste", "other"]
    description: str
    carbon_saved: float

class ChatResponse(BaseModel):
    reply: str = Field(..., description="The Markdown response message from the chatbot")
    auto_log: Optional[AutoLogDetails] = Field(default=None, description="Pydantic log details extracted from user text if they logged an activity")
