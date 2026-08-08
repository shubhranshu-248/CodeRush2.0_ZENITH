"""Execution replay/timeline endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.services.replay_service import ReplayService

router = APIRouter()


@router.get("/replay/{execution_id}/timeline")
async def get_replay_timeline(
    execution_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Return the ordered timeline of events for a completed execution."""
    service = ReplayService(session)
    return await service.get_timeline(execution_id)
