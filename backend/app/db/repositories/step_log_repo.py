"""Repository for StepLog model operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.step_log import StepLog
from app.db.repositories.base import BaseRepository


class StepLogRepository(BaseRepository):
    """Repository providing CRUD and query operations for StepLog records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, StepLog)

    async def get_by_execution_id(self, execution_id: str) -> list[StepLog]:
        """Retrieve all step logs for an execution, ordered by step_number."""
        result = await self._session.execute(
            select(StepLog)
            .where(StepLog.execution_id == execution_id)
            .order_by(StepLog.step_number)
        )
        return list(result.scalars().all())
