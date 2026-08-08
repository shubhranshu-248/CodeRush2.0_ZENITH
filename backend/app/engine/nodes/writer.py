"""Writer node — synthesises research into a coherent document."""

from __future__ import annotations

import json
import logging
import time

from app.ai.base import BaseLLMProvider
from app.ai.prompts.writer import WRITER_SYSTEM_PROMPT, WRITER_USER_PROMPT
from app.engine.state import ForgeState
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)


def _get_provider() -> BaseLLMProvider:
    from app.config import get_settings

    settings = get_settings()
    from app.ai.registry import ProviderRegistry

    return ProviderRegistry.get_default(
        settings.active_api_key,
        settings.default_model,
        settings.default_temperature,
        settings.default_max_tokens,
    )


def _format_research(results: list[dict]) -> str:
    """Pretty-format research results for inclusion in the writer prompt."""
    parts: list[str] = []
    for i, r in enumerate(results, 1):
        parts.append(f"### Research {i} (task: {r.get('task_id', 'N/A')})")
        parts.append(r.get("findings", "No findings."))
        kps = r.get("key_points", [])
        if kps:
            parts.append("\n**Key points:**")
            for kp in kps:
                parts.append(f"- {kp}")
        sources = r.get("sources", [])
        if sources:
            parts.append("\n**Sources:** " + ", ".join(sources))
        parts.append("")
    return "\n".join(parts)


def _mock_draft(plan: dict, research_results: list[dict]) -> str:
    """Return a deterministic mock draft for demo / missing-key scenarios."""
    title = plan.get("title", "Untitled")
    summary = plan.get("summary", "")
    findings_summary = "; ".join(
        r.get("findings", "")[:120] for r in research_results
    )
    return (
        f"# {title}\n\n"
        f"## Summary\n\n{summary}\n\n"
        f"## Findings\n\n{findings_summary}\n\n"
        "## Conclusion\n\n"
        "This is an auto-generated demo draft because no API key was "
        "configured or the LLM call failed.\n"
    )


async def writer_node(state: ForgeState) -> dict:
    """LangGraph node: produce the draft document."""
    execution_id = state.get("execution_id", "")
    plan = state.get("plan", {})
    research_results = state.get("research_results", [])
    start = time.time()

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_STARTED,
            execution_id,
            {"node_id": "writer", "agent_type": "writer", "step_number": 4},
        ),
    )

    tokens_used = 0
    cost = 0.0

    try:
        provider = _get_provider()
        if not provider.api_key:
            raise ValueError("API key is not configured (set GROQ_API_KEY in .env)")

        prompt = WRITER_USER_PROMPT.format(
            plan_title=plan.get("title", ""),
            plan_summary=plan.get("summary", ""),
            research_results=_format_research(research_results),
        )

        response = await provider.generate(prompt, system=WRITER_SYSTEM_PROMPT)
        draft = response.content
        tokens_used = response.tokens_used
        cost = response.cost

    except Exception as exc:
        logger.warning("Writer LLM call failed (%s), using mock draft", exc)
        draft = _mock_draft(plan, research_results)

    elapsed = time.time() - start

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_COMPLETED,
            execution_id,
            {
                "node_id": "writer",
                "agent_type": "writer",
                "step_number": 4,
                "tokens_used": tokens_used,
                "cost": cost,
                "elapsed_seconds": round(elapsed, 2),
            },
        ),
    )

    return {
        "draft": draft,
        "current_step": 4,
        "metadata": {
            "writer_tokens": tokens_used,
            "writer_cost": cost,
            "writer_elapsed": round(elapsed, 2),
        },
        "node_outputs": {"writer": {"draft_length": len(draft)}},
    }
