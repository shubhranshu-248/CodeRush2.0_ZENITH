"""Provider registry — maps model names to concrete LLM provider classes."""

from __future__ import annotations

from typing import Type

from app.ai.base import BaseLLMProvider
from app.ai.gemini import GeminiProvider


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
        """Register a provider class under *name*.

        Parameters
        ----------
        name:
            Lookup key (e.g. ``"gemini-2.5-flash"``).
        provider_class:
            The concrete class to instantiate.
        model_string:
            The ``model`` argument forwarded to the class constructor.
            Defaults to *name* when omitted.
        """
        cls._providers[name] = (provider_class, model_string or name)

    @classmethod
    def get(cls, name: str, **kwargs) -> BaseLLMProvider:
        """Instantiate and return the provider registered under *name*."""
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
        model: str = "gemini-3.5-flash",
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
        """Return the list of registered provider names."""
        return list(cls._providers.keys())


# Pre-register all supported Gemini variants.
# Gemini 3.x (current stable)
ProviderRegistry.register("gemini-3.6-flash", GeminiProvider, "gemini-3.6-flash")
ProviderRegistry.register("gemini-3.5-flash", GeminiProvider, "gemini-3.5-flash")
ProviderRegistry.register("gemini-3.5-flash-lite", GeminiProvider, "gemini-3.5-flash-lite")
# Gemini 2.5 (shutdown Oct 2026; 2.5-flash returning 404 since July 2026)
# Kept registered for backward compat but prefer 3.x models.
ProviderRegistry.register("gemini-2.5-flash", GeminiProvider, "gemini-2.5-flash")
ProviderRegistry.register("gemini-2.5-pro", GeminiProvider, "gemini-2.5-pro")
