"""Join node — synchronisation barrier after parallel research.

No LLM call.  The research_results list is already accumulated by the
LangGraph ``operator.add`` reducer so this node simply emits events and
passes state through.
"""

from __future__ import annotations

import logging

from app.engine.state import ForgeState
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)


async def join_node(state: ForgeState) -> dict:
    """Aggregate research results and emit a completion event."""
    execution_id = state.get("execution_id", "")
    research_results = state.get("research_results", [])

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.STEP_COMPLETED,
            execution_id,
            {
                "node_id": "join",
                "agent_type": "join",
                "step_number": 3,
                "message": "All research tasks completed",
                "research_count": len(research_results),
            },
        ),
    )

    return {
        "current_step": 3,
        "node_outputs": {
            "join": {
                "research_count": len(research_results),
                "task_ids": [r.get("task_id", "") for r in research_results],
            }
        },
    }
