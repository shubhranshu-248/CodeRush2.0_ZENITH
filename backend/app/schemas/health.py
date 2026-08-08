"""Health check response schema."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response for the health check endpoint."""

    status: str
    version: str
    uptime: float
