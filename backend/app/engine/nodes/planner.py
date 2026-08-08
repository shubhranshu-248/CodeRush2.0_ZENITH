"""Planner node — decomposes the user goal into a structured execution plan."""

from __future__ import annotations

import json
import logging
import time

from app.ai.base import BaseLLMProvider
from app.ai.prompts.planner import PLANNER_SYSTEM_PROMPT, PLANNER_USER_PROMPT
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


def _mock_plan(goal: str) -> dict:
    """Return a deterministic fallback plan for demo / missing-key scenarios."""
    return {
        "title": f"Plan for: {goal[:80]}",
        "summary": (
            "This is an auto-generated demo plan because no API key was "
            "configured or the LLM call failed."
        ),
        "tasks": [
            {
                "id": "task_1",
                "title": "Research background information",
                "description": f"Gather background information and key facts related to: {goal}",
                "agent_type": "researcher",
                "dependencies": [],
            },
            {
                "id": "task_2",
                "title": "Research current trends and data",
                "description": f"Research current trends, statistics, and data related to: {goal}",
                "agent_type": "researcher",
                "dependencies": [],
            },
            {
                "id": "task_3",
                "title": "Write comprehensive document",
                "description": (
                    "Synthesise the research findings into a well-structured "
                    "document that addresses the goal."
                ),
                "agent_type": "writer",
                "dependencies": ["task_1", "task_2"],
            },
            {
                "id": "task_4",
                "title": "Verify accuracy and quality",
                "description": (
                    "Review the draft for factual accuracy, completeness, and "
                    "overall quality."
                ),
                "agent_type": "verifier",
                "dependencies": ["task_3"],
            },
        ],
        "parallel_groups": [["task_1", "task_2"]],
    }


async def planner_node(state: ForgeState) -> dict:
    """LangGraph node: plan the execution."""
    execution_id = state.get("execution_id", "")
    goal = state.get("goal", "")
    start = time.time()

    # --- emit STEP_STARTED ---
    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_STARTED,
            execution_id,
            {"node_id": "planner", "agent_type": "planner", "step_number": 1},
        ),
    )

    tokens_used = 0
    cost = 0.0

    try:
        provider = _get_provider()
        if not provider.api_key:
            raise ValueError("Google API key is not configured")

        prompt = PLANNER_USER_PROMPT.format(goal=goal)

        # Single LLM call — generate raw response, then parse JSON
        raw_response = await provider.generate(
            prompt, system=PLANNER_SYSTEM_PROMPT
        )
        tokens_used = raw_response.tokens_used
        cost = raw_response.cost

        from app.ai.gemini import _extract_json

        plan = _extract_json(raw_response.content)

        if "tasks" not in plan:
            raise ValueError("Plan missing 'tasks' key")

    except Exception as exc:
        logger.warning("Planner LLM call failed (%s), using mock plan", exc)
        plan = _mock_plan(goal)

        # Emit a warning event so the frontend console shows why mock data is used
        await event_bus.publish(
            execution_id,
            DomainEvent.create(
                EventType.STEP_STARTED,
                execution_id,
                {
                    "node_id": "planner",
                    "agent_type": "planner",
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
                "node_id": "planner",
                "agent_type": "planner",
                "step_number": 1,
                "outputs": plan,
                "tokens_used": tokens_used,
                "cost": cost,
                "elapsed_seconds": round(elapsed, 2),
            },
        ),
    )

    return {
        "plan": plan,
        "current_step": 1,
        "metadata": {
            "planner_tokens": tokens_used,
            "planner_cost": cost,
            "planner_elapsed": round(elapsed, 2),
        },
        "node_outputs": {"planner": plan},
    }
