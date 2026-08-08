"""Checkpointer setup for LangGraph state persistence."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


@asynccontextmanager
async def get_checkpointer(
    db_path: str = "data/checkpoints.db",
) -> AsyncIterator[AsyncSqliteSaver]:
    """Yield an ``AsyncSqliteSaver`` for graph checkpointing.

    Usage::

        async with get_checkpointer() as saver:
            graph = builder.compile(checkpointer=saver)
            await graph.ainvoke(...)

    The parent directory is created automatically if it does not exist.
    """
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
    async with AsyncSqliteSaver.from_conn_string(db_path) as saver:
        await saver.setup()
        yield saver
