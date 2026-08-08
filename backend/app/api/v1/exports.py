"""Run export endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.schemas.export import ExportRequest
from app.services.export_service import ExportService

router = APIRouter()


@router.post("/export")
async def export_result(
    request: ExportRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Export the results of a completed run in the requested format."""
    service = ExportService(session)
    return await service.export_run(request.run_id, request.format)
