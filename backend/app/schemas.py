from pydantic import BaseModel, Field, EmailStr
from typing import Literal

class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["student", "instructor"]
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
