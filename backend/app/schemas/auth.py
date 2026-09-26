from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    email: str


class AdminInfo(BaseModel):
    id: int
    email: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

