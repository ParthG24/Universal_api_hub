from typing import Dict, Tuple

# Pricing catalog: (price_per_1M_input_tokens_usd, price_per_1M_output_tokens_usd)
MODEL_PRICING: Dict[str, Tuple[float, float]] = {
    # Google Gemini Models
    "gemini-3.8-flash": (0.075, 0.30),
    "gemini-3.5-flash": (0.075, 0.30),
    "gemini-2.0-flash": (0.10, 0.40),
    "gemini-2.0-flash-exp": (0.00, 0.00),  # Experimental free tier
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-1.5-flash-latest": (0.075, 0.30),
    "gemini-1.5-pro": (1.25, 5.00),
    
    # Groq Models (extremely cost effective / fast)
    "llama-3.3-70b-versatile": (0.59, 0.79),
    "llama-3.1-8b-instant": (0.05, 0.08),
    "llama3-70b-8192": (0.59, 0.79),
    "llama3-8b-8192": (0.05, 0.08),
    "mixtral-8x7b-32768": (0.24, 0.24),
    "gemma2-9b-it": (0.20, 0.20),
    
    # OpenAI Models
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.50, 10.00),
    "gpt-3.5-turbo": (0.50, 1.50),

    # Ollama Local Offline Models (100% Free / Local Hardware)
    "ollama": (0.00, 0.00),
    "llama3.2": (0.00, 0.00),
    "deepseek-r1": (0.00, 0.00),
    "mistral": (0.00, 0.00),
    "qwen2.5": (0.00, 0.00),
    "llava": (0.00, 0.00),
    "phi4": (0.00, 0.00),
}

DEFAULT_FALLBACK_PRICING = (0.20, 0.80)


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """
    Computes estimated cost in USD based on model pricing table per million tokens.
    """
    pricing = MODEL_PRICING.get(model.lower())
    if not pricing:
        # Search by substring if exact match not found
        for key, p in MODEL_PRICING.items():
            if key in model.lower():
                pricing = p
                break
    if not pricing:
        pricing = DEFAULT_FALLBACK_PRICING

    input_cost = (input_tokens / 1_000_000.0) * pricing[0]
    output_cost = (output_tokens / 1_000_000.0) * pricing[1]
    return round(input_cost + output_cost, 6)
