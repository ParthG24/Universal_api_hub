import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.providers.base import AIProvider, ContentPart, ModelInfo, ProviderResult


class OllamaProvider(AIProvider):
    name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = (base_url or "http://localhost:11434").rstrip("/")

    async def generate(
        self,
        model: str,
        system_prompt: str,
        user_content: List[ContentPart],
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> ProviderResult:
        endpoint = f"{self.base_url}/api/chat"

        # Build messages list
        messages = []
        if system_prompt:
            sys_text = system_prompt
            if "JSON" not in sys_text.upper():
                sys_text += "\nYou must respond strictly with valid JSON."
            messages.append({"role": "system", "content": sys_text})

        # Process user content (text and images)
        user_text_parts = []
        images_base64 = []
        for part in user_content:
            if part.type == "text" and part.text:
                user_text_parts.append(part.text)
            elif part.type == "image" and part.data_base64:
                images_base64.append(part.data_base64)

        combined_user_text = "\n\n".join(user_text_parts) if user_text_parts else "Generate JSON output."
        user_message: Dict[str, Any] = {"role": "user", "content": combined_user_text}
        if images_base64:
            user_message["images"] = images_base64
        messages.append(user_message)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "format": "json",  # Enforces JSON mode natively in Ollama
            "options": {
                "temperature": 0.2,
            },
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(endpoint, json=payload)
            except httpx.ConnectError:
                raise RuntimeError(
                    f"Could not connect to local Ollama server at {self.base_url}. "
                    "Make sure Ollama is installed and running ('ollama serve' in your terminal)."
                )
            except httpx.TimeoutException:
                raise TimeoutError("Ollama request timed out after 120 seconds. Offline model inference may require more CPU/GPU resources.")
            except Exception as e:
                raise RuntimeError(f"Network error calling local Ollama: {str(e)}")

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if response.status_code != 200:
            raise RuntimeError(f"Ollama returned HTTP {response.status_code}: {response.text}")

        data = response.json()
        raw_text = data.get("message", {}).get("content", "")

        input_tokens = data.get("prompt_eval_count", 0)
        output_tokens = data.get("eval_count", 0)
        total_tokens = input_tokens + output_tokens

        # Ollama runs locally on user machine, zero external API cost
        cost = 0.0

        return ProviderResult(
            raw_text=raw_text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            estimated_cost=cost,
            latency_ms=latency_ms,
        )

    async def list_models(self) -> List[ModelInfo]:
        endpoint = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(endpoint)
                if response.status_code == 200:
                    data = response.json()
                    models_list = data.get("models", [])
                    if models_list:
                        results = []
                        for m in models_list:
                            m_name = m.get("name") or m.get("model") or "unknown"
                            caps = ["text"]
                            if any(k in m_name.lower() for k in ["vision", "llava", "moondream"]):
                                caps.append("vision")
                            results.append(
                                ModelInfo(
                                    id=m_name,
                                    name=f"{m_name} (Local)",
                                    provider=self.name,
                                    capabilities=caps,
                                    context_window=8192,
                                    description="Local offline model running via Ollama",
                                )
                            )
                        return sorted(results, key=lambda x: x.id)
        except Exception:
            pass

        return self._fallback_models()

    def _fallback_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(
                id="llama3.2:latest",
                name="Llama 3.2 (3B - Fast Local)",
                provider=self.name,
                capabilities=["text"],
                context_window=128000,
                description="Ultra-fast local model for text generation and structured JSON extraction.",
            ),
            ModelInfo(
                id="deepseek-r1:8b",
                name="DeepSeek R1 8B (Local Reasoning)",
                provider=self.name,
                capabilities=["text"],
                context_window=32768,
                description="Advanced local reasoning and code generation model.",
            ),
            ModelInfo(
                id="mistral:latest",
                name="Mistral 7B (General Instruct)",
                provider=self.name,
                capabilities=["text"],
                context_window=32768,
                description="Standard balanced local model with strong multilingual and instruction capabilities.",
            ),
            ModelInfo(
                id="qwen2.5:7b",
                name="Qwen 2.5 7B (JSON Specialist)",
                provider=self.name,
                capabilities=["text"],
                context_window=32768,
                description="High fidelity local model for structured JSON schemas and tool calling.",
            ),
            ModelInfo(
                id="llava:latest",
                name="LLaVA 7B (Local Vision)",
                provider=self.name,
                capabilities=["text", "vision"],
                context_window=4096,
                description="Multimodal local vision model for OCR, receipt parsing, and image analysis.",
            ),
            ModelInfo(
                id="phi4:latest",
                name="Phi-4 14B (Compact Powerhouse)",
                provider=self.name,
                capabilities=["text"],
                context_window=16384,
                description="Microsoft's compact open-weight model with near-frontier reasoning performance.",
            ),
        ]
