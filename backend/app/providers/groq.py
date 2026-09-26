import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult
from app.providers.pricing import calculate_cost

# Known decommissioned or deprecated Groq models (as per https://console.groq.com/docs/deprecations)
DECOMMISSIONED_GROQ_MODELS = {
    "gemma2-9b-it",
    "gemma-7b-it",
    "mixtral-8x7b-32768",
    "llama3-8b-8192",
    "llama3-70b-8192",
    "llama-3.2-1b-preview",
    "llama-3.2-3b-preview",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-text-preview",
    "llama-3.2-90b-text-preview",
    "groq/compound",
    "groq/compound-mini",
}


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.base_url = "https://api.groq.com/openai/v1"
        self._cached_active_models: List[str] = []

    async def _get_active_models(self) -> List[str]:
        if not self.api_key:
            return []
        if self._cached_active_models:
            return self._cached_active_models
        endpoint = f"{self.base_url}/models"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(endpoint, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    active = []
                    for m in data.get("data", []):
                        mid = m.get("id", "")
                        # Exclude decommissioned or inactive models
                        if m.get("active", True) is False:
                            continue
                        if mid in DECOMMISSIONED_GROQ_MODELS:
                            continue
                        if any(term in mid.lower() for term in ["gemma", "mixtral", "llama3-", "preview", "compound"]):
                            continue
                        active.append(mid)
                    if active:
                        self._cached_active_models = active
                        return active
        except Exception:
            pass
        return []

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

        # Clean and remap model if decommissioned
        clean_model = model.strip()
        is_decommissioned = (
            clean_model.lower() in DECOMMISSIONED_GROQ_MODELS
            or any(term in clean_model.lower() for term in ["gemma", "mixtral", "llama3-", "preview", "compound"])
        )
        if is_decommissioned or not clean_model:
            clean_model = "llama-3.1-8b-instant"

        # Build candidate list prioritizing reliable 100% free models
        candidate_models = []
        if clean_model:
            candidate_models.append(clean_model)

        # Guaranteed active free-tier production models on Groq Console (30 RPM, 14,400 RPD)
        active_fallbacks = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-20b"]
        for fb in active_fallbacks:
            if fb not in candidate_models:
                candidate_models.append(fb)

        # If clean_model was a 70b model (which might hit rate limits or 404 access restrictions on some free accounts),
        # prioritize llama-3.1-8b-instant first for 100% reliability
        if "70b" in clean_model.lower():
            candidate_models = ["llama-3.1-8b-instant"] + [m for m in candidate_models if m != "llama-3.1-8b-instant"]

        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

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
            elif response.status_code == 401:
                raise RuntimeError("Groq API authentication failed (401). Please verify your GROQ_API_KEY environment variable on Render.")
            else:
                last_error = f"Groq API returned {response.status_code}: {response.text}"
                # For decommissioned models (400), not found (404), rate limit (429), or server errors (500, 502, 503),
                # continue to next candidate model
                continue
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
                        if m.get("active", True) is False:
                            continue
                        if mid in DECOMMISSIONED_GROQ_MODELS:
                            continue
                        if any(term in mid.lower() for term in ["gemma", "mixtral", "llama3-", "preview", "compound"]):
                            continue
                        # Include active production chat completion models
                        if any(k in mid.lower() for k in ["llama-3.1", "llama-3.3", "gpt-oss", "qwen"]):
                            models.append(ModelInfo(
                                id=mid,
                                name=mid,
                                provider=self.name,
                                capabilities=["text"],
                                context_window=m.get("context_window", 128000),
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
                name="Llama 3.1 8B Instant (100% Free Tier Guaranteed)",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="Ultra-low latency model for high-throughput text and JSON tasks on Groq Free Tier (30 RPM, 14,400 RPD).",
            ),
            ModelInfo(
                id="llama-3.3-70b-versatile",
                name="Llama 3.3 70B Versatile (Flagship)",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="State-of-the-art open-weights model with massive 128k context window.",
            ),
            ModelInfo(
                id="openai/gpt-oss-20b",
                name="OpenAI GPT OSS 20B",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="OpenAI open-weight model hosted on Groq high-speed LPU inference.",
            ),
        ]
