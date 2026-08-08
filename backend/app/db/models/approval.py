"""Approval database model."""

from __future__ import annotations

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, UUIDMixin


class Approval(UUIDMixin, Base):
    """Tracks human-in-the-loop approval requests."""

    __tablename__ = "approvals"

    execution_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )
    approved: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[str | None] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
    decided_at: Mapped[str | None] = mapped_column(DateTime, nullable=True)
