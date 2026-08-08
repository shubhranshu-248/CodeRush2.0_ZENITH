"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod

from pydantic import BaseModel


class LLMResponse(BaseModel):
    """Standardised response wrapper returned by every LLM provider."""

    content: str
    tokens_used: int = 0
    cost: float = 0.0
    model: str = ""
    raw: dict = {}


class BaseLLMProvider(ABC):
    """Contract that every concrete LLM provider must satisfy."""

    model: str
    temperature: float
    max_tokens: int

    @abstractmethod
    async def generate(
        self, prompt: str, system: str = "", **kwargs
    ) -> LLMResponse:
        """Generate a free-form text completion."""
        ...

    @abstractmethod
    async def generate_structured(
        self, prompt: str, system: str = "", **kwargs
    ) -> dict:
        """Generate structured JSON output parsed into a Python dict."""
        ...
