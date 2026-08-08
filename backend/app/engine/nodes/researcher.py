"""Researcher nodes — gather information for assigned tasks from the plan."""

from __future__ import annotations

import json
import logging
import time

from app.ai.base import BaseLLMProvider
from app.ai.prompts.researcher import (
    RESEARCHER_SYSTEM_PROMPT,
    RESEARCHER_USER_PROMPT,
)
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


def _get_research_task(plan: dict, index: int) -> dict:
    """Extract the researcher task at *index* from the plan.

    Falls back to a generic task if the index is out of range or the plan
    has no matching researcher task.
    """
    researcher_tasks = [
        t for t in plan.get("tasks", []) if t.get("agent_type") == "researcher"
    ]
    if index < len(researcher_tasks):
        return researcher_tasks[index]
    # Fallback: use any task at that index, or synthesise one
    all_tasks = plan.get("tasks", [])
    if index < len(all_tasks):
        return all_tasks[index]
    return {
        "id": f"task_{index + 1}",
        "title": "General research",
        "description": plan.get("summary", "Research the topic broadly."),
    }


def _mock_research(task: dict) -> dict:
    """Return deterministic mock research for demo / missing-key scenarios."""
    return {
        "task_id": task.get("id", "unknown"),
        "findings": (
            f"Mock research findings for: {task.get('title', 'unknown task')}. "
            "This is auto-generated demo data because no API key was configured "
            "or the LLM call failed."
        ),
        "sources": ["https://example.com/source1", "https://example.com/source2"],
        "key_points": [
            f"Key point about {task.get('title', 'the topic')}",
            "Additional relevant finding",
            "Supporting data point",
        ],
        "confidence_score": 0.75,
    }


async def _researcher_impl(state: ForgeState, task_index: int, node_id: str) -> dict:
    """Shared implementation for both researcher node variants."""
    execution_id = state.get("execution_id", "")
    plan = state.get("plan", {})
    step_number = 2 + task_index  # planner is step 1
    start = time.time()

    task = _get_research_task(plan, task_index)

    # --- emit STEP_STARTED ---
    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_STARTED,
            execution_id,
            {
                "node_id": node_id,
                "agent_type": "researcher",
                "step_number": step_number,
                "task_id": task.get("id"),
            },
        ),
    )

    tokens_used = 0
    cost = 0.0

    try:
        provider = _get_provider()
        if not provider.api_key:
            raise ValueError("API key is not configured (set GROQ_API_KEY in .env)")

        prompt = RESEARCHER_USER_PROMPT.format(
            plan_title=plan.get("title", ""),
            plan_summary=plan.get("summary", ""),
            task_id=task.get("id", ""),
            task_title=task.get("title", ""),
            task_description=task.get("description", ""),
        )

        response = await provider.generate(prompt, system=RESEARCHER_SYSTEM_PROMPT)
        tokens_used = response.tokens_used
        cost = response.cost

        # Parse structured output
        from app.ai.utils import extract_json

        result = extract_json(response.content)
        # Ensure task_id is set
        result.setdefault("task_id", task.get("id", ""))

    except Exception as exc:
        logger.warning(
            "Researcher %s LLM call failed (%s), using mock data", node_id, exc
        )
        result = _mock_research(task)

        await event_bus.publish(
            execution_id,
            DomainEvent.create(
                EventType.STEP_STARTED,
                execution_id,
                {
                    "node_id": node_id,
                    "agent_type": "researcher",
                    "message": f"LLM call failed: {exc}. Using demo data.",
                },
            ),
        )

    elapsed = time.time() - start

    # --- emit STEP_COMPLETED ---
    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_COMPLETED,
            execution_id,
            {
                "node_id": node_id,
                "agent_type": "researcher",
                "step_number": step_number,
                "task_id": task.get("id"),
                "outputs": result,
                "tokens_used": tokens_used,
                "cost": cost,
                "elapsed_seconds": round(elapsed, 2),
            },
        ),
    )

    return {
        "research_results": [result],
        "current_step": step_number,
        "metadata": {
            f"{node_id}_tokens": tokens_used,
            f"{node_id}_cost": cost,
            f"{node_id}_elapsed": round(elapsed, 2),
        },
        "node_outputs": {node_id: result},
    }


async def researcher_node_a(state: ForgeState) -> dict:
    """Researcher A — handles the first researcher task (index 0)."""
    return await _researcher_impl(state, task_index=0, node_id="researcher_a")


async def researcher_node_b(state: ForgeState) -> dict:
    """Researcher B — handles the second researcher task (index 1)."""
    return await _researcher_impl(state, task_index=1, node_id="researcher_b")
