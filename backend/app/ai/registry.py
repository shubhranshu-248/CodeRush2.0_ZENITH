"""Provider registry — maps model names to concrete LLM provider classes."""

from __future__ import annotations

from typing import Type

from app.ai.base import BaseLLMProvider
from app.ai.groq_provider import GroqProvider


class ProviderRegistry:
    """Singleton registry that maps provider/model names to classes."""

    _providers: dict[str, tuple[Type[BaseLLMProvider], str]] = {}

    @classmethod
    def register(
        cls,
        name: str,
        provider_class: Type[BaseLLMProvider],
        model_string: str | None = None,
    ) -> None:
        cls._providers[name] = (provider_class, model_string or name)

    @classmethod
    def get(cls, name: str, **kwargs) -> BaseLLMProvider:
        if name not in cls._providers:
            raise KeyError(
                f"Unknown provider '{name}'. "
                f"Available: {list(cls._providers.keys())}"
            )
        provider_class, model_string = cls._providers[name]
        kwargs.setdefault("model", model_string)
        return provider_class(**kwargs)

    @classmethod
    def get_default(
        cls,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 8192,
    ) -> BaseLLMProvider:
        """Convenience factory that resolves the default provider."""
        return cls.get(
            model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    @classmethod
    def available(cls) -> list[str]:
        return list(cls._providers.keys())


# --- Groq models (default) ---
ProviderRegistry.register("llama-3.3-70b-versatile", GroqProvider)
ProviderRegistry.register("llama-3.1-8b-instant", GroqProvider)
ProviderRegistry.register("openai/gpt-oss-120b", GroqProvider)
ProviderRegistry.register("openai/gpt-oss-20b", GroqProvider)

# --- Gemini models (kept for future use) ---
try:
    from app.ai.gemini import GeminiProvider

    ProviderRegistry.register("gemini-3.5-flash", GeminiProvider)
    ProviderRegistry.register("gemini-3.6-flash", GeminiProvider)
    ProviderRegistry.register("gemini-2.5-flash", GeminiProvider)
except ImportError:
    pass
