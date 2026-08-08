"""Concrete Groq LLM provider using langchain-groq."""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.ai.base import BaseLLMProvider, LLMResponse
from app.ai.utils import extract_json

logger = logging.getLogger(__name__)

# Approximate per-token pricing (USD) for Groq-hosted models.
_PRICING: dict[str, tuple[float, float]] = {
    # (input_cost_per_token, output_cost_per_token)
    "llama-3.3-70b-versatile": (0.59e-6, 0.79e-6),
    "llama-3.1-8b-instant": (0.05e-6, 0.08e-6),
    "openai/gpt-oss-120b": (0.15e-6, 0.60e-6),
    "openai/gpt-oss-20b": (0.075e-6, 0.30e-6),
}


class GroqProvider(BaseLLMProvider):
    """Groq provider backed by *langchain-groq*."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 8192,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_key = api_key
        self.llm = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        rates = _PRICING.get(self.model, (0.10e-6, 0.40e-6))
        return input_tokens * rates[0] + output_tokens * rates[1]

    async def generate(
        self, prompt: str, system: str = "", **kwargs
    ) -> LLMResponse:
        """Generate a free-form text completion."""
        messages: list = []
        if system:
            messages.append(SystemMessage(content=system))
        messages.append(HumanMessage(content=prompt))

        try:
            response = await self.llm.ainvoke(messages)
            content = response.content or ""

            usage = getattr(response, "usage_metadata", None) or {}
            input_tokens = (
                usage.get("input_tokens", 0)
                if isinstance(usage, dict)
                else getattr(usage, "input_tokens", 0)
            )
            output_tokens = (
                usage.get("output_tokens", 0)
                if isinstance(usage, dict)
                else getattr(usage, "output_tokens", 0)
            )
            total_tokens = input_tokens + output_tokens
            cost = self._estimate_cost(input_tokens, output_tokens)

            return LLMResponse(
                content=content,
                tokens_used=total_tokens,
                cost=cost,
                model=self.model,
                raw={
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                },
            )
        except Exception as exc:
            logger.error("Groq generate failed: %s", exc)
            raise

    async def generate_structured(
        self, prompt: str, system: str = "", **kwargs
    ) -> dict:
        """Generate structured JSON output parsed into a Python dict."""
        response = await self.generate(prompt, system=system, **kwargs)
        return extract_json(response.content)
