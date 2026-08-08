"""Conditional edge functions for the Nexora execution graph.

The current graph topology uses static edges with two parallel researcher
nodes (researcher_a, researcher_b) rather than dynamic ``Send`` fan-out.
The edge functions below are kept for future flexibility and for the
verification -> approval / final_output routing decision.
"""

from __future__ import annotations

from app.engine.state import ForgeState


def route_after_verification(state: ForgeState) -> str:
    """Decide whether to require human approval or skip to final output.

    If the verifier marked the draft as passed, route directly to
    ``final_output``.  Otherwise route to ``approval`` so a human can
    decide.

    Note: In the default graph wiring ``approval`` is always visited
    (with ``interrupt_before``).  This function is provided as an
    alternative edge if the builder wants to short-circuit approval for
    auto-approved runs.
    """
    verification = state.get("verification", {})
    if verification.get("passed", False):
        return "approval"
    return "approval"


def should_continue(state: ForgeState) -> str:
    """Check whether the execution should continue or abort.

    Returns ``"__end__"`` if there are critical errors, otherwise
    ``"continue"``.
    """
    errors = state.get("errors", [])
    if len(errors) >= 3:
        return "__end__"
    return "continue"
