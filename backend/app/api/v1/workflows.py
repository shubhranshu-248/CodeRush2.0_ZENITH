"""Workflow generation endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.schemas.run import GoalRequest
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.post("/workflow/generate")
async def generate_workflow(
    request: GoalRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Generate a workflow graph from a natural-language goal."""
    service = WorkflowService(session)
    result = await service.generate_workflow(request.goal, request.options)
    return result
