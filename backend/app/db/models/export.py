"""ExportRecord database model."""

from __future__ import annotations

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, UUIDMixin


class ExportRecord(UUIDMixin, Base):
    """Stores exported workflow execution results."""

    __tablename__ = "exports"

    execution_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )
    format: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str | None] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
