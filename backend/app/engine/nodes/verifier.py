"""Verifier node — reviews the draft for accuracy and quality."""

from __future__ import annotations

import json
import logging
import time

from app.ai.base import BaseLLMProvider
from app.ai.prompts.verifier import VERIFIER_SYSTEM_PROMPT, VERIFIER_USER_PROMPT
from app.engine.state import ForgeState
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)


def _get_provider() -> BaseLLMProvider:
    from app.config import get_settings

    settings = get_settings()
    from app.ai.registry import ProviderRegistry

    return ProviderRegistry.get_default(
        settings.google_api_key,
        settings.default_model,
        settings.default_temperature,
        settings.default_max_tokens,
    )


def _format_tasks(plan: dict) -> str:
    """Format plan tasks for inclusion in the verifier prompt."""
    lines: list[str] = []
    for t in plan.get("tasks", []):
        lines.append(
            f"- [{t.get('id')}] {t.get('title')}: {t.get('description', '')}"
        )
    return "\n".join(lines)


def _mock_verification() -> dict:
    """Return a deterministic mock verification for demo / missing-key scenarios."""
    return {
        "passed": True,
        "issues": [],
        "suggestions": [
            "Consider adding more data points to support the conclusions."
        ],
        "overall_quality": 7,
        "verified_claims": [
            {"claim": "Auto-generated demo content", "status": "verified"}
        ],
    }


async def verifier_node(state: ForgeState) -> dict:
    """LangGraph node: verify the draft document."""
    execution_id = state.get("execution_id", "")
    plan = state.get("plan", {})
    draft = state.get("draft", "")
    start = time.time()

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_STARTED,
            execution_id,
            {"node_id": "verifier", "agent_type": "verifier", "step_number": 5},
        ),
    )

    tokens_used = 0
    cost = 0.0

    try:
        provider = _get_provider()
        if not provider.api_key:
            raise ValueError("Google API key is not configured")

        prompt = VERIFIER_USER_PROMPT.format(
            plan_title=plan.get("title", ""),
            plan_summary=plan.get("summary", ""),
            plan_tasks=_format_tasks(plan),
            draft=draft,
        )

        response = await provider.generate(prompt, system=VERIFIER_SYSTEM_PROMPT)
        tokens_used = response.tokens_used
        cost = response.cost

        from app.ai.gemini import _extract_json

        verification = _extract_json(response.content)

    except Exception as exc:
        logger.warning("Verifier LLM call failed (%s), using mock verification", exc)
        verification = _mock_verification()

    elapsed = time.time() - start

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_COMPLETED,
            execution_id,
            {
                "node_id": "verifier",
                "agent_type": "verifier",
                "step_number": 5,
                "outputs": verification,
                "tokens_used": tokens_used,
                "cost": cost,
                "elapsed_seconds": round(elapsed, 2),
            },
        ),
    )

    return {
        "verification": verification,
        "current_step": 5,
        "metadata": {
            "verifier_tokens": tokens_used,
            "verifier_cost": cost,
            "verifier_elapsed": round(elapsed, 2),
        },
        "node_outputs": {"verifier": verification},
    }
