from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    type: str = Field(..., description="Error classification code")
    message: str = Field(..., description="Sanitized, human-readable error description")


class ExecutionMeta(BaseModel):
    latency_ms: float = 0.0
    tokens: int = 0
    estimated_cost: float = 0.0
    provider: str = ""
    model: str = ""


class InvokeResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[ExecutionMeta] = None
