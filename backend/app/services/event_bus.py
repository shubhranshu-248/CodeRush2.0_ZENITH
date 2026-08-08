"""In-process async event bus for domain events (SSE fan-out)."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict

from app.schemas.events import DomainEvent

logger = logging.getLogger(__name__)


class EventBus:
    """Simple pub/sub bus backed by per-execution asyncio Queues.

    Subscribers call ``subscribe(execution_id)`` to obtain an
    ``asyncio.Queue`` that receives ``DomainEvent`` instances as they
    are published.  Multiple subscribers per execution are supported.
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[DomainEvent]]] = defaultdict(list)

    async def publish(self, execution_id: str, event: DomainEvent) -> None:
        """Publish *event* to all subscribers of *execution_id*."""
        logger.debug("Event %s for %s", event.event_type, execution_id)
        for queue in self._subscribers.get(execution_id, []):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(
                    "Subscriber queue full for %s — dropping event %s",
                    execution_id,
                    event.event_type,
                )

    def subscribe(self, execution_id: str, maxsize: int = 256) -> asyncio.Queue[DomainEvent]:
        """Return a new Queue that will receive events for *execution_id*."""
        queue: asyncio.Queue[DomainEvent] = asyncio.Queue(maxsize=maxsize)
        self._subscribers[execution_id].append(queue)
        return queue

    def unsubscribe(self, execution_id: str, queue: asyncio.Queue[DomainEvent]) -> None:
        """Remove a subscriber queue."""
        subs = self._subscribers.get(execution_id)
        if subs and queue in subs:
            subs.remove(queue)
        if subs is not None and len(subs) == 0:
            del self._subscribers[execution_id]

    def clear(self, execution_id: str) -> None:
        """Remove all subscribers for *execution_id*."""
        self._subscribers.pop(execution_id, None)


# Module-level singleton used across the application.
event_bus = EventBus()
