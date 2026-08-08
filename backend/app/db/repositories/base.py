"""Generic async repository providing common CRUD operations."""

from __future__ import annotations

from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class BaseRepository:
    """Generic async repository for SQLAlchemy models."""

    def __init__(self, session: AsyncSession, model: type) -> None:
        self._session = session
        self._model = model

    async def get_by_id(self, id: str):
        """Retrieve a record by its primary key."""
        result = await self._session.execute(
            select(self._model).where(self._model.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list:
        """Retrieve all records with optional pagination."""
        result = await self._session.execute(
            select(self._model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, data: dict):
        """Create a new record from a dictionary of field values."""
        instance = self._model(**data)
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def update(self, id: str, data: dict):
        """Update an existing record by ID. Returns None if not found."""
        instance = await self.get_by_id(id)
        if instance is None:
            return None
        for key, value in data.items():
            setattr(instance, key, value)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def delete(self, id: str) -> bool:
        """Delete a record by ID. Returns True if deleted, False if not found."""
        instance = await self.get_by_id(id)
        if instance is None:
            return False
        await self._session.delete(instance)
        await self._session.flush()
        return True
