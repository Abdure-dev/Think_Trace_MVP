from pydantic import BaseModel, Field, EmailStr
from typing import Literal, Optional


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["student", "instructor"]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class TraceEvent(BaseModel):
    stage: Literal["understand", "concept", "plan", "attempt", "critique", "reflection"]
    action: Literal["text_submission", "whiteboard_draw", "hint_request", "ai_query", "stage_complete"]
    content: Optional[str] = None

class AIGuidanceRequest(BaseModel):
    stage: str
    student_input: str
    problem: str
    conversation_history: list = []