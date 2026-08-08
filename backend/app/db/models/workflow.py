"""Workflow database model."""

from __future__ import annotations

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, TimestampMixin, UUIDMixin


class Workflow(UUIDMixin, TimestampMixin, Base):
    """Stores workflow definitions with their graph structure."""

    __tablename__ = "workflows"

    goal: Mapped[str] = mapped_column(Text, nullable=False)
    graph_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT")
