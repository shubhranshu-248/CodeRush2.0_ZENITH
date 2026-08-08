"""Declarative base and shared mixins for all database models."""

from __future__ import annotations

from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""

    pass


class UUIDMixin:
    """Mixin providing a UUID primary key."""

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )


class TimestampMixin:
    """Mixin providing created_at and updated_at timestamps."""

    created_at: Mapped[str | None] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
    updated_at: Mapped[str | None] = mapped_column(
        DateTime,
        onupdate=func.now(),
        nullable=True,
    )
