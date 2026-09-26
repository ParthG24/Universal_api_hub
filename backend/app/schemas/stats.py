from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class RequestLogRow(BaseModel):
    id: int
    status: str
    request_timestamp: datetime
    response_time_ms: float
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost: float
    provider: str
    model: str
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    request_preview: Optional[str] = None
    response_preview: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)



class ConnectorStatsResponse(BaseModel):
    connector_id: int
    slug: str
    name: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    success_rate_percent: float = 100.0
    average_response_time_ms: float = 0.0
    total_tokens: int = 0
    estimated_total_cost: float = 0.0
    first_used: Optional[datetime] = None
    last_used: Optional[datetime] = None
    recent_logs: List[RequestLogRow] = Field(default_factory=list)


class GlobalStatsResponse(BaseModel):
    total_connectors: int = 0
    active_connectors: int = 0
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    global_success_rate: float = 100.0
    total_estimated_cost: float = 0.0
    providers_configured: List[str] = Field(default_factory=list)
