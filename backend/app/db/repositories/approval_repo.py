"""Repository for Approval model operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.approval import Approval
from app.db.repositories.base import BaseRepository


class ApprovalRepository(BaseRepository):
    """Repository providing CRUD and query operations for Approval records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Approval)

    async def get_pending_by_execution_id(self, execution_id: str) -> Approval | None:
        """Retrieve the pending (undecided) approval for an execution."""
        result = await self._session.execute(
            select(Approval).where(
                Approval.execution_id == execution_id,
                Approval.approved.is_(None),
            )
        )
        return result.scalars().first()
