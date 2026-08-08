"""Concrete Gemini LLM provider using langchain-google-genai."""

from __future__ import annotations

import json
import logging
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.ai.base import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)

# Approximate per-token pricing (USD) for Gemini models.
# Values are rough estimates used only for cost tracking in the UI.
_PRICING: dict[str, tuple[float, float]] = {
    # (input_cost_per_token, output_cost_per_token)
    "gemini-3.6-flash": (0.10e-6, 0.40e-6),
    "gemini-3.5-flash": (0.15e-6, 0.60e-6),
    "gemini-3.5-flash-lite": (0.05e-6, 0.20e-6),
    "gemini-2.5-flash": (0.15e-6, 0.60e-6),
    "gemini-2.5-pro": (1.25e-6, 5.00e-6),
}


def _extract_json(text: str) -> dict:
    """Extract JSON from plain text or markdown fenced code blocks."""
    # Try the raw string first.
    text = text.strip()
    if text.startswith("{"):
        return json.loads(text)

    # Look for ```json ... ``` or ``` ... ``` blocks.
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())

    # Last resort: find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])

    raise ValueError("No JSON object found in LLM response")


class GeminiProvider(BaseLLMProvider):
    """Google Gemini provider backed by *langchain-google-genai*."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-3.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 8192,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_key = api_key
        # Use minimal thinking for Gemini 3+ models to keep responses
        # fast and avoid complex content-block formats.
        try:
            self.llm = ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=temperature,
                max_output_tokens=max_tokens,
                thinking_level="minimal",
            )
        except TypeError:
            # Older langchain-google-genai without thinking_level support
            self.llm = ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

    def _estimate_cost(
        self, input_tokens: int, output_tokens: int
    ) -> float:
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
            raw_content = response.content
            # Gemini thinking models may return content as a list of blocks
            # e.g. [{"type": "text", "text": "..."}, ...]. Extract text.
            if isinstance(raw_content, list):
                content = " ".join(
                    block.get("text", "")
                    for block in raw_content
                    if isinstance(block, dict) and block.get("type") == "text"
                ) or ""
            else:
                content = raw_content or ""

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
            logger.error("Gemini generate failed: %s", exc)
            raise

    async def generate_structured(
        self, prompt: str, system: str = "", **kwargs
    ) -> dict:
        """Generate structured JSON output parsed into a Python dict."""
        response = await self.generate(prompt, system=system, **kwargs)
        return _extract_json(response.content)
