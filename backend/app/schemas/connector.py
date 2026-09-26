from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


FieldType = Literal["text", "number", "boolean", "image", "file", "json"]
ConnectorStatus = Literal["active", "disabled"]


class InputFieldBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    field_type: FieldType
    required: bool = True
    description: str = Field(default="", max_length=500)
    default_value: Optional[str] = None
    validation_rules: Dict[str, Any] = Field(default_factory=dict)
    order: int = 0

    @field_validator("name")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[a-zA-Z0-9_\-]+$", clean):
            raise ValueError("Field name must contain only letters, numbers, hyphens, and underscores.")
        return clean


class InputFieldCreate(InputFieldBase):
    pass


class InputFieldResponse(InputFieldBase):
    id: int
    connector_id: int
    model_config = ConfigDict(from_attributes=True)


class ConnectorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100)
    description: str = Field(default="")
    provider: str = Field(..., min_length=2, max_length=50)
    model: str = Field(..., min_length=2, max_length=100)
    system_prompt: str = Field(default="")
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    status: ConnectorStatus = "active"

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[a-z0-9_\-]+$", clean):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens or underscores.")
        return clean


class ConnectorCreate(ConnectorBase):
    input_fields: List[InputFieldCreate] = Field(default_factory=list)


class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    output_schema: Optional[Dict[str, Any]] = None
    status: Optional[ConnectorStatus] = None
    input_fields: Optional[List[InputFieldCreate]] = None


class ConnectorSummaryResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    provider: str
    model: str
    status: ConnectorStatus
    total_requests: int = 0
    success_rate: float = 100.0
    last_used: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    input_fields_summary: List[str] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class ConnectorResponse(ConnectorBase):
    id: int
    created_at: datetime
    updated_at: datetime
    input_fields: List[InputFieldResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)



class ConnectorKeyResponse(BaseModel):
    connector_id: int
    slug: str
    name: str
    api_key: str  # Only returned once upon creation or rotation!
    message: str = "Store this API key securely. It cannot be shown again."
