import pytest
from app.providers.ollama import OllamaProvider
from app.providers.base import ContentPart


@pytest.mark.asyncio
async def test_ollama_fallback_models():
    provider = OllamaProvider(base_url="http://localhost:11434")
    # Calling list_models when Ollama is offline should gracefully return fallback models
    models = await provider.list_models()
    assert len(models) >= 5
    model_ids = [m.id for m in models]
    assert "llama3.2:latest" in model_ids
    assert "deepseek-r1:8b" in model_ids
    assert "llava:latest" in model_ids

    # Verify llava has vision capability
    llava_model = next(m for m in models if m.id == "llava:latest")
    assert "vision" in llava_model.capabilities


@pytest.mark.asyncio
async def test_ollama_offline_error_handling():
    # Attempting to generate on an unreachable local port should raise a clear RuntimeError
    provider = OllamaProvider(base_url="http://127.0.0.1:54321")
    user_content = [ContentPart(type="text", text="Hello world")]
    with pytest.raises(RuntimeError) as excinfo:
        await provider.generate(
            model="llama3.2:latest",
            system_prompt="Return JSON",
            user_content=user_content,
        )
    assert "Could not connect to local Ollama" in str(excinfo.value)
