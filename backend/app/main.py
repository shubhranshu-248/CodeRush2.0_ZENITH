"""FastAPI application factory and entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.middleware.cors import setup_cors
from app.api.middleware.error_handler import setup_error_handlers
from app.api.middleware.rate_limiter import RateLimiterMiddleware
from app.api.middleware.request_id import RequestIDMiddleware
from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.db.engine import get_engine, init_db
from app.dependencies import init_session_factory
from app.utils.logging import setup_logging
from app.utils.serialization import ORJSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager.

    On startup:
    - Configures structured logging via loguru.
    - Creates the async SQLAlchemy engine and runs ``CREATE TABLE`` for any
      missing tables.
    - Initializes the global session factory used by ``get_db_session``.

    On shutdown:
    - Disposes of the database engine (closes the connection pool).
    """
    settings = get_settings()
    setup_logging(settings)

    # Initialize database
    engine = get_engine(settings)
    await init_db(engine)
    init_session_factory(settings)

    from loguru import logger

    logger.info(
        "ForgeAI v{version} starting on {host}:{port}",
        version=settings.app_version,
        host=settings.host,
        port=settings.port,
    )

    yield

    logger.info("ForgeAI shutting down")
    await engine.dispose()


def create_app() -> FastAPI:
    """Build and return the fully configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ForgeAI API",
        description="AI Workflow Orchestration Platform",
        version=settings.app_version,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    # --- Middleware (order matters: outermost first) ---
    setup_cors(app, settings.cors_origins)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        RateLimiterMiddleware,
        max_requests=settings.rate_limit_per_minute,
        window_seconds=60,
    )

    # Exception handlers
    setup_error_handlers(app)

    # --- Routes ---
    app.include_router(v1_router)

    return app


# For ``uvicorn app.main:app`` direct invocation
app = create_app()
