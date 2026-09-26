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

        # Build candidate list prioritizing reliable 100% free models
        clean_model = model.strip()
        candidate_models = []
        if clean_model:
            candidate_models.append(clean_model)

        # Guaranteed active free-tier models on Groq Console (30 RPM, 14,400 RPD)
        free_fallbacks = ["llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768"]
        for fb in free_fallbacks:
            if fb not in candidate_models:
                candidate_models.append(fb)

        # If clean_model was a known restricted 70b model, put llama-3.1-8b-instant first
        if "70b" in clean_model.lower():
            candidate_models = ["llama-3.1-8b-instant"] + [m for m in candidate_models if m != "llama-3.1-8b-instant"]

        start_time = time.perf_counter()
        last_error = ""
        actual_model = clean_model
        response = None

        for m_name in candidate_models:
            payload = {
                "model": m_name,
                "messages": messages,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
            async with httpx.AsyncClient(timeout=45.0) as client:
                try:
                    response = await client.post(endpoint, headers=headers, json=payload)
                except httpx.TimeoutException:
                    last_error = f"Groq request to '{m_name}' timed out after 45 seconds."
                    continue
                except Exception as e:
                    last_error = f"Network error calling Groq ({m_name}): {str(e)}"
                    continue

            if response.status_code == 200:
                actual_model = m_name
                break
            else:
                last_error = f"Groq API returned {response.status_code}: {response.text}"
                # If model not found (404), rate limited (429), or unavailable (503), try next candidate
                if response.status_code in [404, 429, 503]:
                    continue
                else:
                    raise RuntimeError(last_error)
        else:
            raise RuntimeError(last_error)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("Groq returned no choices in response.")

        raw_text = choices[0].get("message", {}).get("content", "")

        usage = data.get("usage", {})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", input_tokens + output_tokens)

        cost = calculate_cost(actual_model, input_tokens, output_tokens)

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
                id="llama-3.1-8b-instant",
                name="Llama 3.1 8B Instant (Ultra-Fast & Free)",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="Ultra-low latency model for high-throughput text and JSON tasks on Groq Free Tier.",
            ),
            ModelInfo(
                id="gemma2-9b-it",
                name="Gemma 2 9B IT",
                provider=self.name,
                capabilities=["text"],
                context_window=8192,
                description="Google's high-efficiency lightweight instruction model.",
            ),
            ModelInfo(
                id="mixtral-8x7b-32768",
                name="Mixtral 8x7B (MoE)",
                provider=self.name,
                capabilities=["text"],
                context_window=32768,
                description="High quality Mixture of Experts architecture.",
            ),
            ModelInfo(
                id="llama-3.3-70b-versatile",
                name="Llama 3.3 70B Versatile",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="State-of-the-art open-weights model with massive context window.",
            ),
        ]
