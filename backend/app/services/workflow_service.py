"""Workflow generation and retrieval service."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.workflow import Workflow
from app.db.repositories.base import BaseRepository


class WorkflowService:
    """Creates and retrieves workflow definitions."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = BaseRepository(session, Workflow)

    async def generate_workflow(
        self, goal: str, options: dict | None = None
    ) -> dict:
        """Generate a standard pipeline workflow graph for the given goal.

        The node IDs and positions are fixed to match the frontend's
        useGraphGeneration animation hook exactly.
        """
        options = options or {}
        logger.info("Generating workflow for goal: {}", goal[:80])

        graph_data = self._build_standard_graph()

        now = datetime.now(timezone.utc)
        workflow = await self._repo.create(
            {
                "id": str(uuid4()),
                "goal": goal,
                "graph_data": graph_data,
                "status": "COMPILED",
                "created_at": now,
                "updated_at": now,
            }
        )

        created_at = (
            workflow.created_at.isoformat()
            if hasattr(workflow.created_at, "isoformat")
            else str(workflow.created_at) if workflow.created_at else None
        )
        updated_at = (
            workflow.updated_at.isoformat()
            if hasattr(workflow.updated_at, "isoformat")
            else str(workflow.updated_at) if workflow.updated_at else None
        )

        return {
            "id": workflow.id,
            "goal": workflow.goal,
            "graphData": graph_data,
            "status": workflow.status,
            "createdAt": created_at,
            "updatedAt": updated_at,
        }

    async def get_workflow(self, workflow_id: str) -> Workflow | None:
        """Retrieve a workflow by ID."""
        return await self._repo.get_by_id(workflow_id)

    @staticmethod
    def _build_standard_graph() -> dict:
        """Build the fixed five-node pipeline graph.

        Node IDs and positions must match the frontend's
        useGraphGeneration hook for animation.
        """
        nodes = [
            {
                "id": "1",
                "type": "agent",
                "position": {"x": 250, "y": 50},
                "data": {
                    "label": "Planner",
                    "agentType": "planner",
                    "config": {},
                    "status": "idle",
                },
            },
            {
                "id": "2",
                "type": "agent",
                "position": {"x": 100, "y": 180},
                "data": {
                    "label": "Researcher A",
                    "agentType": "researcher",
                    "config": {},
                    "status": "idle",
                },
            },
            {
                "id": "3",
                "type": "agent",
                "position": {"x": 400, "y": 180},
                "data": {
                    "label": "Researcher B",
                    "agentType": "researcher",
                    "config": {},
                    "status": "idle",
                },
            },
            {
                "id": "4",
                "type": "agent",
                "position": {"x": 250, "y": 310},
                "data": {
                    "label": "Writer",
                    "agentType": "writer",
                    "config": {},
                    "status": "idle",
                },
            },
            {
                "id": "5",
                "type": "agent",
                "position": {"x": 250, "y": 440},
                "data": {
                    "label": "Verifier",
                    "agentType": "verifier",
                    "config": {},
                    "status": "idle",
                },
            },
        ]

        edges = [
            {"id": "e1-2", "source": "1", "target": "2"},
            {"id": "e1-3", "source": "1", "target": "3"},
            {"id": "e2-4", "source": "2", "target": "4"},
            {"id": "e3-4", "source": "3", "target": "4"},
            {"id": "e4-5", "source": "4", "target": "5"},
        ]

        return {"nodes": nodes, "edges": edges}
