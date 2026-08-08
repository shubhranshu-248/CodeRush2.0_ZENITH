"""Centralized exception handlers for the FastAPI application."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from loguru import logger


def setup_error_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI application.

    Three handlers are installed:

    1. **HTTPException** -- passed through with the original status code.
    2. **ValueError** -- mapped to 422 Unprocessable Entity.
    3. **Exception** (catch-all) -- mapped to 500 Internal Server Error.

    All errors are logged and returned in a consistent JSON envelope::

        {"error": "<type>", "detail": "<message>", "status": <code>}
    """

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.warning(
            "HTTPException {status}: {detail}",
            status=exc.status_code,
            detail=exc.detail,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTPException",
                "detail": exc.detail,
                "status": exc.status_code,
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.warning("ValueError: {err}", err=str(exc))
        return JSONResponse(
            status_code=422,
            content={
                "error": "ValueError",
                "detail": str(exc),
                "status": 422,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: {err}", err=str(exc))
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "detail": "An unexpected error occurred.",
                "status": 500,
            },
        )
