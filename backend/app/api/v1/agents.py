"""Agent configuration management endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory store for agent configuration overrides.
# In a production deployment this would be backed by a database table,
# but an in-memory dict is sufficient for the current single-process
# architecture and avoids unnecessary schema migrations.
_agent_configs: dict[str, dict] = {}


class AgentConfigRequest(BaseModel):
    """Request to save agent configuration overrides."""

    agent_type: str
    model: str
    temperature: float


@router.post("/agent/config")
async def save_agent_config(request: AgentConfigRequest):
    """Persist a model/temperature override for the given agent type."""
    _agent_configs[request.agent_type] = {
        "model": request.model,
        "temperature": request.temperature,
    }
    return {"ok": True}


@router.get("/agent/config/{agent_type}")
async def get_agent_config(agent_type: str):
    """Retrieve the current configuration override for an agent type.

    Returns an empty object when no override has been saved.
    """
    return _agent_configs.get(agent_type, {})
