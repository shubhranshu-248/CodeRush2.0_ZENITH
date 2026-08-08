"""Domain event schemas for SSE and internal event bus."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel


class EventType(str, Enum):
    """Types of domain events emitted during workflow execution."""

    EXECUTION_STARTED = "EXECUTION_STARTED"
    EXECUTION_COMPLETED = "EXECUTION_COMPLETED"
    STEP_STARTED = "STEP_STARTED"
    STEP_COMPLETED = "STEP_COMPLETED"
    STEP_FAILED = "STEP_FAILED"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    APPROVAL_SUBMITTED = "APPROVAL_SUBMITTED"
    WORKFLOW_CREATED = "WORKFLOW_CREATED"


class DomainEvent(BaseModel):
    """A domain event emitted during workflow execution."""

    event_type: EventType
    execution_id: str
    data: dict = {}
    timestamp: str
    error: str | None = None

    @classmethod
    def create(
        cls,
        event_type: EventType,
        execution_id: str,
        data: dict | None = None,
        error: str | None = None,
    ) -> DomainEvent:
        """Create a new domain event with an auto-filled ISO timestamp."""
        return cls(
            event_type=event_type,
            execution_id=execution_id,
            data=data or {},
            timestamp=datetime.now(timezone.utc).isoformat(),
            error=error,
        )
