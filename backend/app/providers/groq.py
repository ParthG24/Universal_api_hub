import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult
from app.providers.pricing import calculate_cost


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.base_url = "https://api.groq.com/openai/v1"

    async def generate(
        self,
        model: str,
        system_prompt: str,
        user_content: List[ContentPart],
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> ProviderResult:
        if not self.api_key:
            raise ValueError("Groq API key is not configured on the server. Please add GROQ_API_KEY to your Render environment variables.")

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Build messages list
        messages = []
        if system_prompt:
            # Emphasize JSON requirement in system prompt
            sys_text = system_prompt
            if "JSON" not in sys_text.upper():
                sys_text += "\nYou must respond strictly with valid JSON."
            messages.append({"role": "system", "content": sys_text})

        # Groq chat completions currently support text primarily
        user_text_parts = []
        for part in user_content:
            if part.type == "text" and part.text:
                user_text_parts.append(part.text)
            elif part.type == "image":
                user_text_parts.append("[Attached Image for analysis]")

        combined_user_text = "\n\n".join(user_text_parts) if user_text_parts else "Generate JSON output."
        messages.append({"role": "user", "content": combined_user_text})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(endpoint, headers=headers, json=payload)
            except httpx.TimeoutException:
                raise TimeoutError("Groq request timed out after 45 seconds.")
            except Exception as e:
                raise RuntimeError(f"Network error calling Groq: {str(e)}")

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if response.status_code != 200:
            raise RuntimeError(f"Groq API returned {response.status_code}: {response.text}")

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("Groq returned no choices in response.")

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
                        # Filter for chat completion models
                        if any(k in mid for k in ["llama", "mixtral", "gemma"]):
                            models.append(ModelInfo(
                                id=mid,
                                name=mid,
                                provider=self.name,
                                capabilities=["text"],
                                context_window=m.get("context_window", 8192),
                            ))
                    if models:
                        return sorted(models, key=lambda x: x.id)
        except Exception:
            pass

        return self._fallback_models()

    def _fallback_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(
                id="llama-3.3-70b-versatile",
                name="Llama 3.3 70B Versatile",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="State-of-the-art open-weights model with massive context window.",
            ),
            ModelInfo(
                id="llama-3.1-8b-instant",
                name="Llama 3.1 8B Instant (Ultra Fast)",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="Ultra-low latency model for high-throughput text and JSON tasks.",
            ),
            ModelInfo(
                id="mixtral-8x7b-32768",
                name="Mixtral 8x7B (MoE)",
                provider=self.name,
                capabilities=["text"],
                context_window=32768,
                description="High quality Mixture of Experts architecture.",
            ),
        ]
