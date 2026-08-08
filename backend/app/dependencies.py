"""Dependency injection providers for FastAPI."""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings, get_settings
from app.db.engine import async_session_factory, get_engine

# Module-level session factory (initialized on startup)
_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_session_factory(settings: Settings) -> None:
    """Initialize the global async session factory.

    Must be called once during application startup (inside the lifespan
    context manager) before any request handler runs.
    """
    global _session_factory
    engine = get_engine(settings)
    _session_factory = async_session_factory(engine)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session.

    The session is committed on success and rolled back on any exception.
    """
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_session_factory() first.")
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_settings_dep() -> Settings:
    """FastAPI dependency that returns the cached application settings."""
    return get_settings()
