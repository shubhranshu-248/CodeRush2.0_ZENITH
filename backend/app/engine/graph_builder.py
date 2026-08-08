"""Build and compile the Nexora LangGraph StateGraph."""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.engine.nodes import (
    approval,
    final_output,
    join,
    planner,
    researcher,
    verifier,
    writer,
)
from app.engine.state import ForgeState


def build_graph() -> StateGraph:
    """Construct the raw ``StateGraph`` (uncompiled).

    Topology::

        planner ──┬── researcher_a ──┬── join ── writer ── verifier ── approval ── final_output ── END
                  └── researcher_b ──┘

    ``researcher_a`` and ``researcher_b`` run in parallel (LangGraph
    schedules them concurrently because they share the same predecessor
    and have no ordering edge between them).
    """
    builder = StateGraph(ForgeState)

    # -- nodes --
    builder.add_node("planner", planner.planner_node)
    builder.add_node("researcher_a", researcher.researcher_node_a)
    builder.add_node("researcher_b", researcher.researcher_node_b)
    builder.add_node("join", join.join_node)
    builder.add_node("writer", writer.writer_node)
    builder.add_node("verifier", verifier.verifier_node)
    builder.add_node("approval", approval.approval_node)
    builder.add_node("final_output", final_output.final_output_node)

    # -- edges --
    builder.set_entry_point("planner")

    # Fan-out: planner -> two researchers in parallel
    builder.add_edge("planner", "researcher_a")
    builder.add_edge("planner", "researcher_b")

    # Fan-in: both researchers -> join
    builder.add_edge("researcher_a", "join")
    builder.add_edge("researcher_b", "join")

    # Sequential pipeline
    builder.add_edge("join", "writer")
    builder.add_edge("writer", "verifier")
    builder.add_edge("verifier", "approval")
    builder.add_edge("approval", "final_output")
    builder.add_edge("final_output", END)

    return builder


async def compile_graph(checkpointer=None):
    """Compile the graph with optional checkpointer and interrupt support.

    The ``interrupt_before=["approval"]`` setting causes the graph to
    pause execution before entering the approval node, giving the API
    layer a chance to surface the draft to the user for review.

    When no checkpointer is provided, ``interrupt_before`` is omitted
    because LangGraph requires a checkpointer to support interrupts.
    The graph will run straight through without pausing for approval.
    """
    builder = build_graph()
    compile_kwargs: dict = {}
    if checkpointer is not None:
        compile_kwargs["checkpointer"] = checkpointer
        compile_kwargs["interrupt_before"] = ["approval"]
    return builder.compile(**compile_kwargs)
