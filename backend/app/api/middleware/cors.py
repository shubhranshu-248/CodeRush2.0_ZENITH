"""CORS middleware configuration."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI, origins: list[str]) -> None:
    """Add CORS middleware to the FastAPI application.

    Parameters
    ----------
    app:
        The FastAPI application instance.
    origins:
        Allowed origin URLs (e.g. ``["http://localhost:3000"]``).
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
