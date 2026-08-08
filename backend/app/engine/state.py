"""LangGraph state definition for the Nexora execution graph."""

from __future__ import annotations

import operator
from typing import Annotated, TypedDict


def _merge_dicts(a: dict, b: dict) -> dict:
    """Reducer that shallow-merges two dicts."""
    return {**a, **b}


def _max_int(a: int, b: int) -> int:
    """Reducer that keeps the higher value (for progress tracking)."""
    return a if a > b else b


class ForgeState(TypedDict):
    """Shared state that flows through every node in the graph."""

    # Input
    goal: str

    # Planner output
    plan: dict

    # Researcher outputs — accumulated via the ``operator.add`` reducer
    research_results: Annotated[list[dict], operator.add]

    # Writer output
    draft: str

    # Verifier output
    verification: dict

    # Final assembled output
    final_output: str

    # Human-in-the-loop approval
    approval_status: str       # "pending" | "approved" | "rejected"
    approval_feedback: str

    # Progress tracking — use max so parallel nodes don't conflict
    current_step: Annotated[int, _max_int]

    # Per-node outputs keyed by node name — merged via dict union
    node_outputs: Annotated[dict, _merge_dicts]

    # Error accumulator
    errors: Annotated[list[str], operator.add]

    # Aggregated metadata (tokens, cost, timing) — merged across nodes
    metadata: Annotated[dict, _merge_dicts]

    # Correlation id used for event emission
    execution_id: str
