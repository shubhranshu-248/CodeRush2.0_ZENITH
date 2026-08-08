"""Run/execution-related schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class GoalRequest(BaseModel):
    """Request to create and execute a workflow from a goal."""

    goal: str
    options: dict = {}


class RunResponse(BaseModel):
    """Response for a workflow execution run."""

    id: str
    run_id: str
    status: str
    state_snapshot: dict | None = None


class RunSummary(BaseModel):
    """Summary of a workflow execution run."""

    id: str
    goal: str
    status: str
    agent_count: int = 0
    duration_ms: int = 0
    cost: float = 0.0
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True)
