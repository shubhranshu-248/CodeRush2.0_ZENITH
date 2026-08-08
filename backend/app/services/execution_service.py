"""Execution orchestration service — coordinates LangGraph runs, events, and approvals."""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from uuid import uuid4

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.execution import Execution
from app.db.models.step_log import StepLog
from app.db.models.workflow import Workflow
from app.db.repositories.base import BaseRepository
from app.engine.checkpointer import get_checkpointer
from app.engine.graph_builder import compile_graph
from app.schemas.events import DomainEvent, EventType
from app.services.event_bus import event_bus
from app.services.workflow_service import WorkflowService


def _get_session_factory():
    """Import the session factory lazily to avoid circular imports."""
    from app.dependencies import _session_factory
    if _session_factory is None:
        raise RuntimeError("Database not initialized")
    return _session_factory

# Module-level dicts for approval signalling across tasks.
_approval_events: dict[str, asyncio.Event] = {}
_approval_decisions: dict[str, dict] = {}


class ExecutionService:
    """Core orchestrator that manages workflow executions end-to-end."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._exec_repo = BaseRepository(session, Execution)
        self._step_repo = BaseRepository(session, StepLog)
        self._workflow_repo = BaseRepository(session, Workflow)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def start_execution(
        self, goal: str, options: dict | None = None
    ) -> dict:
        """Create a workflow + execution, launch the graph in the background.

        Returns a RunResponse-shaped dict immediately so the caller
        (API route) can respond to the client without blocking.
        """
        options = options or {}
        logger.info("Starting execution for goal: {}", goal[:80])

        # 1. Generate the workflow
        wf_service = WorkflowService(self._session)
        workflow_data = await wf_service.generate_workflow(goal, options)
        workflow_id = workflow_data["id"]

        # 2. Create the Execution record
        run_id = str(uuid4())
        execution = await self._exec_repo.create(
            {
                "id": str(uuid4()),
                "workflow_id": workflow_id,
                "run_id": run_id,
                "status": "PENDING",
                "agent_count": 5,
            }
        )
        await self._session.commit()

        # 3. Emit WORKFLOW_CREATED
        await event_bus.publish(
            execution.id,
            DomainEvent.create(
                event_type=EventType.WORKFLOW_CREATED,
                execution_id=execution.id,
                data={"workflow_id": workflow_id, "goal": goal},
            ),
        )

        # 4. Launch graph execution in the background
        asyncio.create_task(
            self._run_graph(execution.id, goal),
            name=f"graph-{execution.id}",
        )

        # 5. Return immediately
        # IMPORTANT: `id` must be the execution ID because the frontend
        # uses it for SSE subscription and approval submission.
        return {
            "id": execution.id,
            "run_id": execution.id,
            "workflow_id": workflow_id,
            "status": execution.status,
            "state_snapshot": None,
        }

    async def get_run(self, run_id: str) -> dict | None:
        """Look up a single execution by its ID and return a RunResponse dict."""
        execution = await self._exec_repo.get_by_id(run_id)
        if execution is None:
            return None

        return {
            "id": execution.workflow_id,
            "run_id": execution.id,
            "status": execution.status,
            "state_snapshot": execution.state_snapshot,
        }

    async def get_all_runs(self) -> list[dict]:
        """Return RunSummary-shaped dicts for every execution."""
        result = await self._session.execute(
            select(Execution).order_by(Execution.created_at.desc())
        )
        executions = list(result.scalars().all())
        summaries: list[dict] = []

        for ex in executions:
            workflow = await self._workflow_repo.get_by_id(ex.workflow_id)
            goal = workflow.goal if workflow else ""
            created_at = (
                ex.created_at.isoformat()
                if hasattr(ex.created_at, "isoformat")
                else str(ex.created_at) if ex.created_at else None
            )
            summaries.append(
                {
                    "id": ex.id,
                    "goal": goal,
                    "status": ex.status,
                    "agent_count": ex.agent_count or 0,
                    "duration_ms": ex.duration_ms or 0,
                    "cost": ex.cost or 0.0,
                    "created_at": created_at,
                }
            )

        return summaries

    async def resume_after_approval(
        self,
        execution_id: str,
        approved: bool,
        feedback: str = "",
    ) -> None:
        """Signal the background graph task to continue after approval."""
        logger.info(
            "Approval received for {}: approved={}", execution_id, approved
        )
        _approval_decisions[execution_id] = {
            "approved": approved,
            "feedback": feedback,
        }
        evt = _approval_events.get(execution_id)
        if evt is not None:
            evt.set()
        else:
            logger.warning(
                "No approval event found for execution {}", execution_id
            )

    # ------------------------------------------------------------------
    # Background graph execution
    # ------------------------------------------------------------------

    async def _run_graph(self, execution_id: str, goal: str) -> None:
        """Execute the LangGraph workflow in the background.

        Creates its own DB session (the request-scoped one is closed by the
        time the background task actually runs).
        """
        # Give the frontend time to establish SSE subscription before
        # we start emitting events (especially important when mock
        # fallbacks complete near-instantly).
        await asyncio.sleep(0.3)

        start_time = time.monotonic()
        session_factory = _get_session_factory()

        async with session_factory() as session:
            exec_repo = BaseRepository(session, Execution)
            step_repo = BaseRepository(session, StepLog)

            try:
                # 1. Compile graph with checkpointer
                from app.config import get_settings as _gs
                _settings = _gs()

                checkpointer = None
                checkpointer_ctx = None
                try:
                    checkpointer_ctx = get_checkpointer(_settings.checkpoint_db_path)
                    checkpointer = await checkpointer_ctx.__aenter__()
                except Exception as cp_err:
                    logger.warning(
                        "Checkpointer init failed ({}), running without checkpointing",
                        cp_err,
                    )
                    checkpointer = None
                    checkpointer_ctx = None

                try:
                    graph = await compile_graph(checkpointer=checkpointer)

                    # 2. Mark RUNNING
                    await exec_repo.update(execution_id, {"status": "RUNNING"})
                    await session.commit()

                    await event_bus.publish(
                        execution_id,
                        DomainEvent.create(
                            event_type=EventType.EXECUTION_STARTED,
                            execution_id=execution_id,
                        ),
                    )

                    # 3. Build initial state
                    initial_state = {
                        "goal": goal,
                        "execution_id": execution_id,
                        "plan": {},
                        "research_results": [],
                        "draft": "",
                        "verification": {},
                        "final_output": "",
                        "approval_status": "pending",
                        "approval_feedback": "",
                        "current_step": 0,
                        "node_outputs": {},
                        "errors": [],
                        "metadata": {},
                    }

                    config = {"configurable": {"thread_id": execution_id}}

                    # 4. Invoke graph (will interrupt at approval node if checkpointer is set)
                    result = await graph.ainvoke(initial_state, config=config)

                    # 5. Check if graph interrupted for approval
                    needs_approval = False
                    if checkpointer is not None:
                        try:
                            graph_state = await graph.aget_state(config)
                            needs_approval = bool(graph_state.next)
                        except Exception as state_err:
                            logger.warning("Could not check graph state: {}", state_err)

                    if needs_approval:
                        # Graph interrupted — waiting for approval
                        await exec_repo.update(
                            execution_id, {"status": "WAITING_APPROVAL"}
                        )
                        await session.commit()

                        await event_bus.publish(
                            execution_id,
                            DomainEvent.create(
                                event_type=EventType.APPROVAL_REQUIRED,
                                execution_id=execution_id,
                                data={
                                    "draft": result.get("draft", ""),
                                    "verification": result.get("verification", {}),
                                },
                            ),
                        )

                        # 6. Wait for approval signal (auto-approve after 120s for demo)
                        approval_event = asyncio.Event()
                        _approval_events[execution_id] = approval_event

                        try:
                            await asyncio.wait_for(approval_event.wait(), timeout=120.0)
                        except asyncio.TimeoutError:
                            logger.info(
                                "Auto-approving execution {} after timeout",
                                execution_id,
                            )
                            _approval_decisions[execution_id] = {
                                "approved": True,
                                "feedback": "Auto-approved (timeout)",
                            }
                        finally:
                            _approval_events.pop(execution_id, None)

                        decision = _approval_decisions.pop(execution_id, {})
                        approved = decision.get("approved", False)
                        feedback = decision.get("feedback", "")

                        # 7. Update state and resume graph
                        await graph.aupdate_state(
                            config,
                            {
                                "approval_status": "approved" if approved else "rejected",
                                "approval_feedback": feedback,
                            },
                        )

                        result = await graph.ainvoke(None, config=config)

                    # 8. Completed successfully
                    elapsed_ms = int((time.monotonic() - start_time) * 1000)

                    state_snapshot = {
                        "goal": result.get("goal", goal),
                        "plan": result.get("plan", {}),
                        "research_results": result.get("research_results", []),
                        "draft": result.get("draft", ""),
                        "verification": result.get("verification", {}),
                        "final_output": result.get("final_output", ""),
                    }

                    await exec_repo.update(
                        execution_id,
                        {
                            "status": "COMPLETED",
                            "duration_ms": elapsed_ms,
                            "state_snapshot": state_snapshot,
                            "completed_at": datetime.now(timezone.utc),
                        },
                    )
                    await session.commit()

                    # Save step logs from node_outputs
                    await self._save_step_logs_with(
                        session, step_repo, execution_id,
                        result.get("node_outputs", {}),
                    )

                    await event_bus.publish(
                        execution_id,
                        DomainEvent.create(
                            event_type=EventType.EXECUTION_COMPLETED,
                            execution_id=execution_id,
                            data={
                                "duration_ms": elapsed_ms,
                                "final_output": result.get("final_output", ""),
                            },
                        ),
                    )

                    logger.info(
                        "Execution {} completed in {}ms", execution_id, elapsed_ms
                    )

                finally:
                    # Clean up checkpointer context manager
                    if checkpointer_ctx is not None:
                        try:
                            await checkpointer_ctx.__aexit__(None, None, None)
                        except Exception:
                            pass

            except Exception as exc:
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                error_msg = str(exc)
                logger.exception(
                    "Execution {} failed: {}", execution_id, error_msg
                )

                try:
                    await exec_repo.update(
                        execution_id,
                        {
                            "status": "FAILED",
                            "error": error_msg,
                            "duration_ms": elapsed_ms,
                            "completed_at": datetime.now(timezone.utc),
                        },
                    )
                    await session.commit()
                except Exception:
                    logger.exception(
                        "Failed to persist error state for {}", execution_id
                    )

                await event_bus.publish(
                    execution_id,
                    DomainEvent.create(
                        event_type=EventType.EXECUTION_COMPLETED,
                        execution_id=execution_id,
                        data={"duration_ms": elapsed_ms},
                        error=error_msg,
                    ),
                )
            finally:
                _approval_events.pop(execution_id, None)
                _approval_decisions.pop(execution_id, None)

    async def _save_step_logs_with(
        self,
        session: AsyncSession,
        step_repo: BaseRepository,
        execution_id: str,
        node_outputs: dict,
    ) -> None:
        """Persist step-level logs from the graph's node_outputs dict."""
        # (node_key, agent_type) — node_key matches keys in node_outputs,
        # agent_type is the canonical type stored in the step log.
        node_order = [
            ("planner", "planner"),
            ("researcher_a", "researcher"),
            ("researcher_b", "researcher"),
            ("join", "join"),
            ("writer", "writer"),
            ("verifier", "verifier"),
            ("approval", "approval"),
            ("final_output", "final_output"),
        ]

        step = 0
        for node_key, agent_type in node_order:
            output = node_outputs.get(node_key)
            if output is None:
                continue

            step += 1
            try:
                await step_repo.create(
                    {
                        "id": str(uuid4()),
                        "execution_id": execution_id,
                        "node_id": node_key,
                        "agent_type": agent_type,
                        "status": "completed",
                        "step_number": step,
                        "outputs": output if isinstance(output, dict) else {"result": output},
                        "duration_ms": output.get("duration_ms", 0) if isinstance(output, dict) else 0,
                        "tokens_used": output.get("tokens_used", 0) if isinstance(output, dict) else 0,
                        "cost": output.get("cost", 0.0) if isinstance(output, dict) else 0.0,
                    }
                )
            except Exception:
                logger.exception(
                    "Failed to save step log for {} step {}",
                    execution_id,
                    step,
                )

        try:
            await session.commit()
        except Exception:
            logger.exception(
                "Failed to commit step logs for {}", execution_id
            )
