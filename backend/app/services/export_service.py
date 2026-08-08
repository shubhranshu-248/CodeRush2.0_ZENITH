"""Export service for generating downloadable execution results."""

from __future__ import annotations

import json
from uuid import uuid4

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.execution import Execution
from app.db.models.export import ExportRecord
from app.db.models.step_log import StepLog
from app.db.repositories.base import BaseRepository


class ExportService:
    """Generates and persists exported execution results."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._exec_repo = BaseRepository(session, Execution)
        self._export_repo = BaseRepository(session, ExportRecord)

    async def export_run(
        self, run_id: str, format: str = "MARKDOWN"
    ) -> dict:
        """Export the results of an execution in the requested format.

        Parameters
        ----------
        run_id:
            The execution ID.
        format:
            One of MARKDOWN, JSON, TEXT, PDF.

        Returns
        -------
        dict
            An ExportResponse-shaped dict with content, format, and run_id.
        """
        logger.info("Exporting run {} as {}", run_id, format)

        # 1. Fetch execution
        execution = await self._exec_repo.get_by_id(run_id)
        if execution is None:
            raise ValueError(f"Execution {run_id} not found")

        # 2. Fetch step logs
        result = await self._session.execute(
            select(StepLog)
            .where(StepLog.execution_id == run_id)
            .order_by(StepLog.step_number)
        )
        step_logs = list(result.scalars().all())

        # 3. Extract state data
        state = execution.state_snapshot or {}
        goal = state.get("goal", "")
        plan = state.get("plan", {})
        research_results = state.get("research_results", [])
        draft = state.get("draft", "")
        verification = state.get("verification", {})
        final_output = state.get("final_output", "")

        # 4. Build content based on format
        format_upper = format.upper()
        if format_upper == "JSON":
            content = self._build_json(
                execution, step_logs, goal, plan, research_results,
                draft, verification, final_output,
            )
        elif format_upper == "TEXT":
            content = self._build_text(
                goal, plan, research_results, draft, verification,
                final_output,
            )
        else:
            # MARKDOWN and PDF both produce markdown (frontend renders PDF)
            content = self._build_markdown(
                goal, plan, research_results, draft, verification,
                final_output,
            )

        # 5. Persist ExportRecord
        await self._export_repo.create(
            {
                "id": str(uuid4()),
                "execution_id": run_id,
                "format": format_upper,
                "content": content,
            }
        )
        await self._session.commit()

        # 6. Return ExportResponse
        return {
            "content": content,
            "format": format_upper,
            "run_id": run_id,
        }

    # ------------------------------------------------------------------
    # Format builders
    # ------------------------------------------------------------------

    @staticmethod
    def _build_markdown(
        goal: str,
        plan: dict,
        research_results: list,
        draft: str,
        verification: dict,
        final_output: str,
    ) -> str:
        """Build a clean markdown report focused on the actual deliverable.

        The final_output (or draft) IS the deliverable — it's the content
        the LLM agents produced.  The export should surface that, not dump
        internal execution metadata.
        """
        # Use final_output first; fall back to draft if final_output is empty.
        deliverable = (final_output or draft or "").strip()

        if deliverable:
            return deliverable

        # If somehow neither final_output nor draft has content, build a
        # minimal summary from whatever we have.
        sections: list[str] = []
        sections.append(f"# Report: {goal}\n")

        plan_summary = plan.get("summary", "") if isinstance(plan, dict) else ""
        if plan_summary:
            sections.append(f"{plan_summary}\n")

        for i, finding in enumerate(research_results or [], 1):
            if isinstance(finding, dict):
                findings_text = finding.get("findings", "")
                if findings_text:
                    sections.append(f"## Research {i}\n\n{findings_text}\n")

        return "\n".join(sections) or f"# {goal}\n\nNo output was generated."

    @staticmethod
    def _build_text(
        goal: str,
        plan: dict,
        research_results: list,
        draft: str,
        verification: dict,
        final_output: str,
    ) -> str:
        lines: list[str] = []

        lines.append("NEXORA EXECUTION REPORT")
        lines.append("=" * 40)
        lines.append("")

        if goal:
            lines.append(f"GOAL: {goal}")
            lines.append("")

        if plan:
            lines.append("PLAN:")
            if isinstance(plan, dict):
                for key, value in plan.items():
                    lines.append(f"  {key}: {value}")
            else:
                lines.append(f"  {plan}")
            lines.append("")

        if research_results:
            lines.append("RESEARCH FINDINGS:")
            for i, finding in enumerate(research_results, 1):
                if isinstance(finding, dict):
                    title = finding.get("title", f"Finding {i}")
                    body = finding.get("content", finding.get("summary", str(finding)))
                    lines.append(f"  [{i}] {title}")
                    lines.append(f"      {body}")
                else:
                    lines.append(f"  [{i}] {finding}")
            lines.append("")

        if draft:
            lines.append("DRAFT:")
            lines.append(draft)
            lines.append("")

        if verification:
            lines.append("VERIFICATION:")
            if isinstance(verification, dict):
                for key, value in verification.items():
                    lines.append(f"  {key}: {value}")
            else:
                lines.append(f"  {verification}")
            lines.append("")

        if final_output:
            lines.append("FINAL OUTPUT:")
            lines.append(final_output)
            lines.append("")

        return "\n".join(lines)

    @staticmethod
    def _build_json(
        execution: object,
        step_logs: list,
        goal: str,
        plan: dict,
        research_results: list,
        draft: str,
        verification: dict,
        final_output: str,
    ) -> str:
        log_entries = []
        for log in step_logs:
            log_entries.append(
                {
                    "id": log.id,
                    "node_id": log.node_id,
                    "agent_type": log.agent_type,
                    "status": log.status,
                    "step_number": log.step_number,
                    "duration_ms": log.duration_ms,
                    "tokens_used": log.tokens_used,
                    "cost": log.cost,
                    "outputs": log.outputs,
                }
            )

        data = {
            "execution_id": getattr(execution, "id", ""),
            "status": getattr(execution, "status", ""),
            "goal": goal,
            "plan": plan,
            "research_results": research_results,
            "draft": draft,
            "verification": verification,
            "final_output": final_output,
            "steps": log_entries,
        }

        return json.dumps(data, indent=2, default=str)
