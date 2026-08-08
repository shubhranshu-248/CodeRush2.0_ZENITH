"""Common schema types shared across the application."""

from __future__ import annotations

import math
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper."""

    data: T | None = None
    error: str | None = None
    status: int = 200


class ErrorResponse(BaseModel):
    """Structured error response."""

    error: str
    detail: str | None = None
    request_id: str | None = None
    status: int = 500


class Pagination(BaseModel):
    """Pagination metadata."""

    page: int = 1
    page_size: int = 20
    total: int = 0
    total_pages: int = 0

    def compute_total_pages(self) -> None:
        """Calculate total_pages from total and page_size."""
        if self.page_size > 0:
            self.total_pages = math.ceil(self.total / self.page_size)
        else:
            self.total_pages = 0
