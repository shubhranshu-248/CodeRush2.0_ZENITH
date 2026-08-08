"""Approval node — human-in-the-loop gate.

This is a lightweight pass-through.  The actual interruption is handled by
LangGraph's ``interrupt_before`` mechanism configured in the graph builder.
When the graph resumes after the interrupt, this node reads the current
``approval_status`` from state and emits the appropriate event.
"""

from __future__ import annotations

import logging

from app.engine.state import ForgeState
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)


async def approval_node(state: ForgeState) -> dict:
    """LangGraph node: emit approval events and pass state through."""
    execution_id = state.get("execution_id", "")
    status = state.get("approval_status", "pending")
    feedback = state.get("approval_feedback", "")

    if status == "pending":
        await event_bus.publish(
            execution_id,
            DomainEvent.create(
                EventType.APPROVAL_REQUIRED,
                execution_id,
                {
                    "node_id": "approval",
                    "step_number": 6,
                    "verification": state.get("verification", {}),
                    "draft_preview": state.get("draft", "")[:500],
                },
            ),
        )

    if status == "approved":
        await event_bus.publish(
            execution_id,
            DomainEvent.create(
                EventType.APPROVAL_SUBMITTED,
                execution_id,
                {
                    "node_id": "approval",
                    "step_number": 6,
                    "status": "approved",
                    "feedback": feedback,
                },
            ),
        )

    if status == "rejected":
        await event_bus.publish(
            execution_id,
            DomainEvent.create(
                EventType.APPROVAL_SUBMITTED,
                execution_id,
                {
                    "node_id": "approval",
                    "step_number": 6,
                    "status": "rejected",
                    "feedback": feedback,
                },
            ),
        )

    return {
        "current_step": 6,
        "node_outputs": {
            "approval": {"status": status, "feedback": feedback}
        },
    }
