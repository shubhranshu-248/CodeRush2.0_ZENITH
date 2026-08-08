"""Export-related schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ExportRequest(BaseModel):
    """Request to export execution results."""

    run_id: str
    format: Literal["MARKDOWN", "PDF", "JSON", "TEXT"] = "MARKDOWN"


class ExportResponse(BaseModel):
    """Response containing exported content."""

    content: str
    format: str
    run_id: str
