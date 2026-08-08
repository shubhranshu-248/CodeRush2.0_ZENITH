"""Simple in-memory token-bucket rate limiter middleware."""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Per-IP token-bucket rate limiter.

    Each IP address is allocated *max_requests* tokens.  Tokens are consumed
    on every request and refilled at a steady rate of *max_requests* tokens
    per *window_seconds* seconds.

    When a client exhausts its tokens a ``429 Too Many Requests`` response
    is returned with a ``Retry-After`` header indicating how many seconds
    the client should wait before retrying.

    Parameters
    ----------
    app:
        The ASGI application.
    max_requests:
        Maximum burst size (tokens per bucket).  Defaults to 30.
    window_seconds:
        Refill window in seconds.  Defaults to 60.
    """

    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.refill_rate = max_requests / window_seconds
        # {ip: (tokens_remaining, last_refill_timestamp)}
        self._buckets: dict[str, tuple[float, float]] = {}

    def _get_tokens(self, ip: str) -> tuple[float, float]:
        """Return (tokens, last_refill_time) for *ip*, creating a fresh
        bucket when the IP is seen for the first time."""
        now = time.monotonic()
        if ip not in self._buckets:
            self._buckets[ip] = (float(self.max_requests), now)
            return float(self.max_requests), now

        tokens, last_refill = self._buckets[ip]
        elapsed = now - last_refill
        tokens = min(self.max_requests, tokens + elapsed * self.refill_rate)
        return tokens, now

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Skip rate limiting for health checks and SSE event streams
        if request.url.path.endswith("/health") or request.url.path.endswith("/events"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        tokens, now = self._get_tokens(client_ip)

        if tokens < 1.0:
            retry_after = int((1.0 - tokens) / self.refill_rate) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RateLimited",
                    "detail": "Too many requests. Please try again later.",
                    "status": 429,
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Consume one token
        self._buckets[client_ip] = (tokens - 1.0, now)
        return await call_next(request)
