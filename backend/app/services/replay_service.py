"""Replay service for retrieving execution timeline data."""

from __future__ import annotations

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.step_log import StepLog


# Human-readable display names for agent types.
_DISPLAY_NAMES: dict[str, str] = {
    "planner": "Planner",
    "researcher": "Researcher",
    "writer": "Writer",
    "verifier": "Verifier",
    "join": "Join Node",
    "approval": "Approval Gate",
    "final_output": "Final Output",
}

# Map internal step status to timeline status.
_STATUS_MAP: dict[str, str] = {
    "completed": "completed",
    "failed": "failed",
    "running": "running",
    "pending": "pending",
    "skipped": "skipped",
}


def _display_name(agent_type: str) -> str:
    """Return a human-readable name for the given agent type."""
    return _DISPLAY_NAMES.get(agent_type, agent_type.replace("_", " ").title())


def _map_status(status: str) -> str:
    """Normalise a step log status to a timeline-friendly value."""
    return _STATUS_MAP.get(status, status)


class ReplayService:
    """Provides execution timeline data for the replay viewer."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_timeline(self, execution_id: str) -> list[dict]:
        """Return an ordered list of ExecutionEvent-shaped dicts for a run.

        Each entry corresponds to one step log, sorted by step_number.
        """
        logger.debug("Building timeline for execution {}", execution_id)

        result = await self._session.execute(
            select(StepLog)
            .where(StepLog.execution_id == execution_id)
            .order_by(StepLog.step_number)
        )
        logs = list(result.scalars().all())

        timeline: list[dict] = []
        for log in logs:
            timestamp = (
                log.timestamp.isoformat()
                if hasattr(log.timestamp, "isoformat")
                else str(log.timestamp) if log.timestamp else None
            )
            timeline.append(
                {
                    "id": log.id,
                    "timestamp": timestamp,
                    "nodeName": _display_name(log.agent_type),
                    "status": _map_status(log.status),
                    "duration": log.duration_ms,
                }
            )

        return timeline
