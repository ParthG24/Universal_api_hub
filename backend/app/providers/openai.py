import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult
from app.providers.pricing import calculate_cost


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.base_url = "https://api.openai.com/v1"

    async def generate(
        self,
        model: str,
        system_prompt: str,
        user_content: List[ContentPart],
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> ProviderResult:
        if not self.api_key:
            raise ValueError("OpenAI API key is not configured.")

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        user_parts = []
        for part in user_content:
            if part.type == "text" and part.text:
                user_parts.append({"type": "text", "text": part.text})
            elif part.type == "image" and part.data_base64:
                mime = part.mime_type or "image/jpeg"
                user_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{part.data_base64}"}
                })

        messages.append({"role": "user", "content": user_parts if user_parts else "Generate JSON output."})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(endpoint, headers=headers, json=payload)
            except httpx.TimeoutException:
                raise TimeoutError("OpenAI request timed out after 60 seconds.")
            except Exception as e:
                raise RuntimeError(f"Network error calling OpenAI: {str(e)}")

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if response.status_code != 200:
            raise RuntimeError(f"OpenAI API returned {response.status_code}: {response.text}")

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenAI returned no choices.")

        raw_text = choices[0].get("message", {}).get("content", "")

        usage = data.get("usage", {})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", input_tokens + output_tokens)

        cost = calculate_cost(model, input_tokens, output_tokens)

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

        endpoint = f"{self.base_url}/models"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(endpoint, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for m in data.get("data", []):
                        mid = m.get("id", "")
                        if "gpt" in mid and "realtime" not in mid:
                            caps = ["text"]
                            if "4o" in mid:
                                caps.append("vision")
                            models.append(ModelInfo(
                                id=mid,
                                name=mid,
                                provider=self.name,
                                capabilities=caps,
                            ))
                    if models:
                        return sorted(models, key=lambda x: x.id)
        except Exception:
            pass

        return self._fallback_models()

    def _fallback_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(
                id="gpt-4o-mini",
                name="GPT-4o Mini (Affordable Multimodal)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=128000,
            ),
            ModelInfo(
                id="gpt-4o",
                name="GPT-4o (Flagship Multimodal)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=128000,
            ),
        ]
