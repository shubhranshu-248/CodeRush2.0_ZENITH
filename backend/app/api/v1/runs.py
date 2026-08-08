"""Execution run endpoints and SSE event streaming."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.dependencies import get_db_session
from app.schemas.run import GoalRequest
from app.services.event_bus import event_bus
from app.services.execution_service import ExecutionService

router = APIRouter()


@router.post("/run")
async def start_run(
    request: GoalRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Start a new workflow execution run for the given goal."""
    service = ExecutionService(session)
    result = await service.start_execution(request.goal, request.options)
    return result


@router.get("/runs")
async def list_runs(
    session: AsyncSession = Depends(get_db_session),
):
    """List all execution runs."""
    service = ExecutionService(session)
    return await service.get_all_runs()


@router.get("/runs/{run_id}")
async def get_run(
    run_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Get details for a specific execution run."""
    service = ExecutionService(session)
    result = await service.get_run(run_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return result


@router.get("/runs/{execution_id}/events")
async def stream_events(execution_id: str):
    """SSE endpoint for real-time execution events.

    The frontend uses ``EventSource`` and listens for named events such as
    ``STEP_COMPLETED``, ``EXECUTION_COMPLETED``, etc.  Each SSE frame
    carries:
    - ``event:`` the ``EventType`` enum value (e.g. ``STEP_COMPLETED``)
    - ``data:`` the full ``DomainEvent`` serialized as JSON
    """

    async def event_generator():
        queue = event_bus.subscribe(execution_id)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                except asyncio.TimeoutError:
                    # Send a keep-alive comment to prevent proxy/browser timeout
                    yield {"comment": "keep-alive"}
                    continue

                yield {
                    "event": event.event_type.value,
                    "data": event.model_dump_json(),
                }

                # Stop streaming after terminal events
                if event.event_type.value in (
                    "EXECUTION_COMPLETED",
                    "STEP_FAILED",
                ):
                    break
        finally:
            event_bus.unsubscribe(execution_id, queue)

    return EventSourceResponse(event_generator())
