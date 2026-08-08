"""Async database engine and session factory setup."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import Settings
from app.db.models.base import Base


def get_engine(settings: Settings):
    """Create and return an async SQLAlchemy engine."""
    return create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
    )


def async_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    """Create an async session factory bound to the given engine."""
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def init_db(engine) -> None:
    """Create all database tables and ensure the data directory exists."""
    # Ensure the data directory exists
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        # Import all models so they register with Base.metadata
        import app.db.models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)
