import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult
from app.providers.pricing import calculate_cost


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def generate(
        self,
        model: str,
        system_prompt: str,
        user_content: List[ContentPart],
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> ProviderResult:
        if not self.api_key:
            raise ValueError("Gemini API key is not configured.")

        # Ensure model is cleanly formatted
        clean_model = model.replace("models/", "")
        endpoint = f"{self.base_url}/models/{clean_model}:generateContent?key={self.api_key}"

        # Construct parts for Gemini contents
        parts = []
        for part in user_content:
            if part.type == "text" and part.text:
                parts.append({"text": part.text})
            elif part.type == "image" and part.data_base64:
                parts.append({
                    "inline_data": {
                        "mime_type": part.mime_type or "image/jpeg",
                        "data": part.data_base64,
                    }
                })
            elif part.type == "file" and part.data_base64:
                parts.append({
                    "inline_data": {
                        "mime_type": part.mime_type or "application/octet-stream",
                        "data": part.data_base64,
                    }
                })

        generation_config: Dict[str, Any] = {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        }

        payload: Dict[str, Any] = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": generation_config,
        }

        if system_prompt:
            payload["system_instruction"] = {
                "parts": [{"text": system_prompt}]
            }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(endpoint, json=payload)
            except httpx.TimeoutException:
                raise TimeoutError("Gemini request timed out after 60 seconds.")
            except Exception as e:
                raise RuntimeError(f"Network error calling Gemini: {str(e)}")

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if response.status_code != 200:
            error_msg = f"Gemini API returned {response.status_code}: {response.text}"
            raise RuntimeError(error_msg)

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates in response.")

        candidate = candidates[0]
        content_parts = candidate.get("content", {}).get("parts", [])
        raw_text = "".join(p.get("text", "") for p in content_parts if "text" in p)

        # Parse usage metadata
        usage = data.get("usageMetadata", {})
        input_tokens = usage.get("promptTokenCount", 0)
        output_tokens = usage.get("candidatesTokenCount", 0)
        total_tokens = usage.get("totalTokenCount", input_tokens + output_tokens)

        # Compute cost
        cost = calculate_cost(clean_model, input_tokens, output_tokens)

        return ProviderResult(
            raw_text=raw_text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            estimated_cost=cost,
            latency_ms=latency_ms,
        )

    async def list_models(self) -> List[ModelInfo]:
        if not self.api_key:
            return self._fallback_models()

        endpoint = f"{self.base_url}/models?key={self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(endpoint)
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for m in data.get("models", []):
                        methods = m.get("supportedGenerationMethods", [])
                        if "generateContent" in methods:
                            mid = m.get("name", "").replace("models/", "")
                            display_name = m.get("displayName", mid)
                            caps = ["text"]
                            if "vision" in mid.lower() or "flash" in mid.lower() or "pro" in mid.lower():
                                caps.append("vision")
                            models.append(ModelInfo(
                                id=mid,
                                name=display_name,
                                provider=self.name,
                                capabilities=caps,
                                context_window=m.get("inputTokenLimit"),
                                description=m.get("description"),
                            ))
                    if models:
                        return models
        except Exception:
            pass

        return self._fallback_models()

    def _fallback_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(
                id="gemini-1.5-flash",
                name="Gemini 1.5 Flash (Fast & Multimodal)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="Fast and versatile multimodal model for text and image analysis.",
            ),
            ModelInfo(
                id="gemini-2.0-flash",
                name="Gemini 2.0 Flash (Next-Gen)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="Next-generation multimodal model with state-of-the-art reasoning.",
            ),
            ModelInfo(
                id="gemini-1.5-pro",
                name="Gemini 1.5 Pro (Deep Reasoning)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=2000000,
                description="High-intelligence model for complex tasks and large contexts.",
            ),
        ]
