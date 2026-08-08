"""Approval service for human-in-the-loop workflow gates."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.approval import Approval
from app.db.models.execution import Execution
from app.db.repositories.base import BaseRepository
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus
from app.services.execution_service import ExecutionService


class ApprovalService:
    """Handles submission and persistence of approval decisions."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._approval_repo = BaseRepository(session, Approval)
        self._exec_repo = BaseRepository(session, Execution)

    async def submit_approval(
        self,
        run_id: str,
        approved: bool,
        feedback: str = "",
    ) -> dict:
        """Submit an approval decision for a waiting execution.

        Parameters
        ----------
        run_id:
            The execution ID (same value returned as ``run_id`` in RunResponse).
        approved:
            Whether the human reviewer approved the output.
        feedback:
            Optional reviewer feedback.

        Returns
        -------
        dict
            A RunResponse-shaped dictionary reflecting the updated execution.
        """
        logger.info(
            "Approval submitted for {}: approved={}, feedback='{}'",
            run_id,
            approved,
            feedback[:60] if feedback else "",
        )

        # 1. Find the execution
        execution = await self._exec_repo.get_by_id(run_id)
        if execution is None:
            raise ValueError(f"Execution {run_id} not found")

        if execution.status != "WAITING_APPROVAL":
            raise ValueError(
                f"Execution {run_id} is not waiting for approval "
                f"(current status: {execution.status})"
            )

        # 2. Create or update Approval record
        result = await self._session.execute(
            select(Approval).where(Approval.execution_id == run_id)
        )
        existing = result.scalars().first()

        if existing is not None:
            existing.approved = approved
            existing.feedback = feedback
            existing.decided_at = datetime.now(timezone.utc)
            await self._session.flush()
            await self._session.refresh(existing)
        else:
            await self._approval_repo.create(
                {
                    "id": str(uuid4()),
                    "execution_id": run_id,
                    "approved": approved,
                    "feedback": feedback,
                    "decided_at": datetime.now(timezone.utc),
                }
            )

        await self._session.commit()

        # 3. Emit APPROVAL_SUBMITTED event
        await event_bus.publish(
            run_id,
            DomainEvent.create(
                event_type=EventType.APPROVAL_SUBMITTED,
                execution_id=run_id,
                data={"approved": approved, "feedback": feedback},
            ),
        )

        # 4. Signal the execution service to resume
        exec_service = ExecutionService(self._session)
        await exec_service.resume_after_approval(run_id, approved, feedback)

        # 5. Return RunResponse dict
        return {
            "id": execution.workflow_id,
            "run_id": execution.id,
            "status": "APPROVED" if approved else "REJECTED",
            "state_snapshot": execution.state_snapshot,
        }
