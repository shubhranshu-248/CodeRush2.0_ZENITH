"""Workflow-related schemas matching the frontend type definitions."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

AgentType = Literal[
    "planner",
    "researcher",
    "parallel_research",
    "writer",
    "verifier",
    "join",
    "approval",
    "final_output",
]


class NodeConfig(BaseModel):
    """Configuration for a workflow node."""

    temperature: float | None = None
    prompt: str | None = None
    max_tokens: int | None = None

    model_config = ConfigDict(extra="allow")


class NodeData(BaseModel):
    """Data payload for a workflow node."""

    label: str
    agentType: AgentType = Field(alias="agent_type")
    config: NodeConfig = NodeConfig()
    status: Literal["idle", "queued", "running", "completed", "failed", "waiting_approval"] = "idle"
    duration: float | None = None
    error: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class FlowNode(BaseModel):
    """A node in the workflow graph."""

    id: str
    type: str
    position: dict[str, float]
    data: NodeData


class FlowEdge(BaseModel):
    """An edge connecting two nodes in the workflow graph."""

    id: str
    source: str
    target: str
    label: str | None = None
    condition: str | None = None


class WorkflowGraph(BaseModel):
    """Complete workflow graph containing nodes and edges."""

    nodes: list[FlowNode]
    edges: list[FlowEdge]


class WorkflowResponse(BaseModel):
    """API response for a workflow."""

    id: str
    goal: str
    graphData: WorkflowGraph = Field(alias="graph_data")
    status: str
    createdAt: str | None = Field(default=None, alias="created_at")
    updatedAt: str | None = Field(default=None, alias="updated_at")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
