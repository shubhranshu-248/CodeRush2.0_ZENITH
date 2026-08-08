"""Logging setup using loguru."""

from __future__ import annotations

import sys
from pathlib import Path

from loguru import logger

from app.config import Settings


def setup_logging(settings: Settings) -> None:
    """Configure loguru with stderr and rotating file handlers."""
    # Remove default handler
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{extra[request_id]:>8}</cyan> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    # Configure default extras
    logger.configure(extra={"request_id": "-"})

    # Add stderr handler
    logger.add(
        sys.stderr,
        format=log_format,
        level=settings.log_level,
        colorize=True,
    )

    # Ensure log directory exists
    log_dir = Path(settings.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    # Add rotating file handler
    logger.add(
        str(log_dir / "forgeai.log"),
        format=log_format,
        level=settings.log_level,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        colorize=False,
    )
