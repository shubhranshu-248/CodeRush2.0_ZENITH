"""Repository for Execution model operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.execution import Execution
from app.db.repositories.base import BaseRepository


class ExecutionRepository(BaseRepository):
    """Repository providing CRUD and query operations for Execution records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Execution)

    async def get_by_run_id(self, run_id: str) -> Execution | None:
        """Retrieve an execution by its run_id."""
        result = await self._session.execute(
            select(Execution).where(Execution.run_id == run_id)
        )
        return result.scalars().first()

    async def get_all_summaries(self, skip: int = 0, limit: int = 100) -> list[Execution]:
        """Retrieve all executions ordered by created_at descending."""
        result = await self._session.execute(
            select(Execution)
            .order_by(Execution.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
