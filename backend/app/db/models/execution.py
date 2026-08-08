"""Execution database model."""

from __future__ import annotations

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, UUIDMixin


class Execution(UUIDMixin, Base):
    """Tracks individual workflow execution runs."""

    __tablename__ = "executions"

    workflow_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )
    run_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    state_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_count: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str | None] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
    completed_at: Mapped[str | None] = mapped_column(DateTime, nullable=True)
