"""StepLog database model."""

from __future__ import annotations

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, UUIDMixin


class StepLog(UUIDMixin, Base):
    """Logs individual step executions within a workflow run."""

    __tablename__ = "step_logs"

    execution_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )
    node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    agent_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    inputs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    outputs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[str | None] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
