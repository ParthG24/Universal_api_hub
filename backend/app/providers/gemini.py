import time
import json
import asyncio
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult
from app.providers.pricing import calculate_cost


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip().strip('"').strip("'")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self._cached_active_models: List[str] = []

    async def _get_active_models(self) -> List[str]:
        if not self.api_key:
            return []
        if self._cached_active_models:
            return self._cached_active_models
        endpoint = f"{self.base_url}/models"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(endpoint, headers=headers)
                if res.status_code != 200:
                    res = await client.get(f"{endpoint}?key={self.api_key}")
                if res.status_code == 200:
                    data = res.json()
                    active = []
                    for m in data.get("models", []):
                        if "generateContent" in m.get("supportedGenerationMethods", []):
                            active.append(m.get("name", "").replace("models/", ""))
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
            raise ValueError("Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your Render environment variables.")

        # Ensure model is cleanly formatted
        clean_model = model.replace("models/", "")

        # Auto-map retired legacy models directly to current flagship or low-demand model
        RETIRED_MODELS = {
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
        }
        if clean_model in RETIRED_MODELS:
            clean_model = "gemini-3.8-flash"
        
        # Discover live supported models for this specific Google API key
        active_models = await self._get_active_models()

        candidate_models = []
        if clean_model in active_models:
            candidate_models.append(clean_model)
        elif clean_model not in RETIRED_MODELS:
            candidate_models.append(clean_model)

        # 2026 Flagship and Low-Demand models
        preferred_models = [
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
        ]

        if active_models:
            for p in preferred_models:
                if p in active_models and p not in candidate_models:
                    candidate_models.append(p)
            # If requested model wasn't active and no preferred found, pick first active
            if not candidate_models:
                candidate_models.extend([m for m in active_models if m not in RETIRED_MODELS][:3])
        else:
            for p in preferred_models:
                if p not in candidate_models:
                    candidate_models.append(p)

        # Deduplicate while preserving priority order
        candidate_models = list(dict.fromkeys(candidate_models))

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

        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

        start_time = time.perf_counter()
        last_error = ""

        for m_name in candidate_models:
            endpoint = f"{self.base_url}/models/{m_name}:generateContent"
            async with httpx.AsyncClient(timeout=45.0) as client:
                try:
                    # Primary authentication via x-goog-api-key header
                    response = await client.post(endpoint, headers=headers, json=payload)
                    # If 401 unsupported token format, fallback to query param key
                    if response.status_code == 401 and "ACCESS_TOKEN_TYPE_UNSUPPORTED" in response.text:
                        query_endpoint = f"{endpoint}?key={self.api_key}"
                        response = await client.post(query_endpoint, json=payload)
                except httpx.TimeoutException:
                    last_error = f"Gemini request to '{m_name}' timed out after 45 seconds."
                    continue
                except Exception as e:
                    last_error = f"Network error calling Gemini ({m_name}): {str(e)}"
                    continue

            if response.status_code == 200:
                clean_model = m_name
                break
            else:
                last_error = f"Gemini API returned {response.status_code}: {response.text}"
                # If overloaded (503 high demand), rate limited (429), or not found (404), try next candidate
                if response.status_code in [404, 429, 503]:
                    await asyncio.sleep(0.2)
                    continue
                elif response.status_code == 401:
                    raise RuntimeError(
                        f"Gemini API returned 401 (Unauthenticated). "
                        f"Please ensure your GEMINI_API_KEY environment variable on Render is a valid Google AI Studio key. "
                        f"Details: {response.text}"
                    )
                else:
                    raise RuntimeError(last_error)
        else:
            raise RuntimeError(last_error)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

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

        endpoint = f"{self.base_url}/models"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(endpoint, headers=headers)
                if response.status_code != 200:
                    response = await client.get(f"{endpoint}?key={self.api_key}")
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
                id="gemini-3.8-flash",
                name="Gemini 3.8 Flash (Latest Flagship / Vision)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="Google's flagship 2026 multimodal model with ultra-fast vision and structured extraction.",
            ),
            ModelInfo(
                id="gemini-3.5-flash-lite",
                name="Gemini 3.5 Flash-Lite (Low Demand / High Capacity)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="High-throughput, low-demand workhorse model with minimal queue latency.",
            ),
            ModelInfo(
                id="gemini-3.5-flash",
                name="Gemini 3.5 Flash (Stable GA)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="Stable, high-efficiency multimodal model for reasoning, text, and images.",
            ),
            ModelInfo(
                id="gemini-3.7-flash",
                name="Gemini 3.7 Flash",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=1000000,
                description="High-capability Flash predecessor model.",
            ),
        ]
