from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DocParam(BaseModel):
    name: str
    type: str
    required: bool
    description: str
    default_value: Optional[str] = None
    validation_rules: Dict[str, Any] = Field(default_factory=dict)


class ConnectorDocResponse(BaseModel):
    slug: str
    name: str
    description: str
    endpoint_url: str
    http_method: str = "POST"
    content_type: str  # 'multipart/form-data' or 'application/json'
    auth_header: str = "X-API-Key: <YOUR_CONNECTOR_API_KEY>"
    provider: str
    model: str
    parameters: List[DocParam] = Field(default_factory=list)
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    example_request_json: Optional[Dict[str, Any]] = None
    example_success_response: Dict[str, Any]
    example_error_responses: Dict[str, Dict[str, Any]]
    curl_snippet: str
    python_snippet: str
    javascript_snippet: str
