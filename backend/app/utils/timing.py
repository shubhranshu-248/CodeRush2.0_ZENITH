"""Timing utilities for profiling async functions."""

from __future__ import annotations

import functools
import time

from loguru import logger


def async_timed(func):
    """Decorator that logs the execution time of an async function."""

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.debug(
                "{}.{} completed in {:.2f}ms",
                func.__module__,
                func.__qualname__,
                elapsed_ms,
            )
            return result
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.warning(
                "{}.{} failed after {:.2f}ms",
                func.__module__,
                func.__qualname__,
                elapsed_ms,
            )
            raise

    return wrapper
