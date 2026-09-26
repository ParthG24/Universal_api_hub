from abc import ABC, abstractmethod
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ContentPart(BaseModel):
    """Represents a text or multimodal content item in the prompt."""
    type: str = Field(..., description="'text', 'image', or 'file'")
    text: Optional[str] = None
    data_base64: Optional[str] = None
    mime_type: Optional[str] = None
    filename: Optional[str] = None


class ModelInfo(BaseModel):
    """Metadata describing an AI model."""
    id: str
    name: str
    provider: str
    capabilities: List[str] = Field(default_factory=lambda: ["text"])  # "text", "vision"
    context_window: Optional[int] = None
    description: Optional[str] = None


class ProviderResult(BaseModel):
    """Standardized output returned by any AI Provider Adapter."""
    raw_text: str
    parsed_json: Optional[Any] = None
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    latency_ms: float = 0.0


class AIProvider(ABC):
    """Abstract Base Class for all AI Provider adapters."""
    name: str

    @abstractmethod
    async def generate(
        self,
        model: str,
        system_prompt: str,
        user_content: List[ContentPart],
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> ProviderResult:
        """Invokes the model and returns a standardized ProviderResult."""
        pass

    @abstractmethod
    async def list_models(self) -> List[ModelInfo]:
        """Lists available models from the provider."""
        pass
