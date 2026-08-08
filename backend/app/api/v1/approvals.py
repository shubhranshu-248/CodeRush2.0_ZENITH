"""Human-in-the-loop approval endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.schemas.approval import ApprovalRequest
from app.services.approval_service import ApprovalService

router = APIRouter()


@router.post("/approve")
async def submit_approval(
    request: ApprovalRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Submit an approval or rejection for a pending execution step."""
    service = ApprovalService(session)
    result = await service.submit_approval(
        request.run_id,
        request.approved,
        request.feedback,
    )
    return result
