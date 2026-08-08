"""Aggregated v1 API router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import agents, approvals, exports, health, replay, runs, workflows

router = APIRouter(prefix="/api/v1")

router.include_router(workflows.router, tags=["Workflows"])
router.include_router(runs.router, tags=["Runs"])
router.include_router(approvals.router, tags=["Approvals"])
router.include_router(replay.router, tags=["Replay"])
router.include_router(exports.router, tags=["Exports"])
router.include_router(agents.router, tags=["Agents"])
router.include_router(health.router, tags=["Health"])
