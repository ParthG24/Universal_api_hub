from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.providers.base import AIProvider, ModelInfo
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.openai import OpenAIProvider
from app.providers.ollama import OllamaProvider


class ProviderRegistry:
    """Central registry mapping provider name -> AIProvider instance."""

    def __init__(self):
        self._providers: Dict[str, AIProvider] = {}
        self.reload()

    def reload(self):
        """Initializes or reloads providers based on configured environment settings."""
        self._providers = {
            "gemini": GeminiProvider(api_key=settings.GEMINI_API_KEY),
            "groq": GroqProvider(api_key=settings.GROQ_API_KEY),
            "openai": OpenAIProvider(api_key=settings.OPENAI_API_KEY),
            "ollama": OllamaProvider(base_url=settings.OLLAMA_BASE_URL),
        }

    def get(self, name: str) -> Optional[AIProvider]:
        """Retrieves a provider adapter by name ('gemini', 'groq', 'openai', 'ollama')."""
        return self._providers.get(name.lower())

    def list_available_providers(self) -> List[Dict[str, Any]]:
        """Returns metadata about configured providers and whether their API keys are configured."""
        result = []
        for name, provider in self._providers.items():
            is_configured = False
            if name == "gemini":
                is_configured = bool(settings.GEMINI_API_KEY)
            elif name == "groq":
                is_configured = bool(settings.GROQ_API_KEY)
            elif name == "openai":
                is_configured = bool(settings.OPENAI_API_KEY)
            elif name == "ollama":
                is_configured = True  # Offline local engine requires no external API keys

            result.append({
                "id": name,
                "name": "Ollama (Offline/Local)" if name == "ollama" else name.capitalize(),
                "configured": is_configured,
            })
        return result

    async def list_models_for_provider(self, provider_name: str) -> List[ModelInfo]:
        """Returns model list for a given provider."""
        provider = self.get(provider_name)
        if not provider:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider.list_models()


# Global singleton provider registry
provider_registry = ProviderRegistry()
