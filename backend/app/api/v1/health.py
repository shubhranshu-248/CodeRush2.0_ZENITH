"""Health check endpoint."""

from __future__ import annotations

import time

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()

_start_time = time.time()


@router.get("/health")
async def health_check():
    """Return application health status, version, and uptime."""
    settings = get_settings()
    return {
        "status": "healthy",
        "version": settings.app_version,
        "uptime": round(time.time() - _start_time, 2),
    }
