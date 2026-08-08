"""Approval-related schemas."""

from __future__ import annotations

from pydantic import BaseModel


class ApprovalRequest(BaseModel):
    """Request to approve or reject a pending approval."""

    run_id: str
    approved: bool
    feedback: str | None = None
