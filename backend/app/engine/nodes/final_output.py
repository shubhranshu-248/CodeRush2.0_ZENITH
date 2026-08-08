"""Final output node — assembles the deliverable and emits completion."""

from __future__ import annotations

import logging
import time

from app.engine.state import ForgeState
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)


async def final_output_node(state: ForgeState) -> dict:
    """LangGraph node: assemble the final output from draft + verification."""
    execution_id = state.get("execution_id", "")
    draft = state.get("draft", "")
    verification = state.get("verification", {})
    plan = state.get("plan", {})
    start = time.time()

    # Build final output — the draft augmented with a verification appendix
    sections: list[str] = [draft]

    if verification:
        sections.append("\n\n---\n")
        sections.append("## Verification Report\n")
        quality = verification.get("overall_quality", "N/A")
        passed = verification.get("passed", False)
        sections.append(f"**Overall quality:** {quality}/10\n")
        sections.append(f"**Passed review:** {'Yes' if passed else 'No'}\n")

        issues = verification.get("issues", [])
        if issues:
            sections.append("\n### Issues\n")
            for issue in issues:
                sections.append(f"- {issue}")

        suggestions = verification.get("suggestions", [])
        if suggestions:
            sections.append("\n### Suggestions\n")
            for suggestion in suggestions:
                sections.append(f"- {suggestion}")

    final_output = "\n".join(sections)
    elapsed = time.time() - start

    # Aggregate total cost / tokens from metadata
    metadata = state.get("metadata", {})
    total_tokens = sum(
        v for k, v in metadata.items() if k.endswith("_tokens") and isinstance(v, (int, float))
    )
    total_cost = sum(
        v for k, v in metadata.items() if k.endswith("_cost") and isinstance(v, (int, float))
    )

    await event_bus.publish(
        execution_id,
        DomainEvent.create(
            EventType.EXECUTION_COMPLETED,
            execution_id,
            {
                "node_id": "final_output",
                "step_number": 7,
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 6),
                "elapsed_seconds": round(elapsed, 2),
                "output_length": len(final_output),
            },
        ),
    )

    return {
        "final_output": final_output,
        "current_step": 7,
        "metadata": {
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
        },
        "node_outputs": {
            "final_output": {
                "output_length": len(final_output),
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 6),
            }
        },
    }
