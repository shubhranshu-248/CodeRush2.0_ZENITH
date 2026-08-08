"""Repository for Workflow model operations."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.workflow import Workflow
from app.db.repositories.base import BaseRepository


class WorkflowRepository(BaseRepository):
    """Repository providing CRUD operations for Workflow records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Workflow)
