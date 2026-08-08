"""Middleware that attaches a unique request ID to every request."""

from __future__ import annotations

import uuid

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Inject an ``X-Request-ID`` header into every request and response.

    If the incoming request already carries an ``X-Request-ID`` header it is
    reused; otherwise a new UUID4 is generated.  The ID is also bound to the
    loguru context so that every log line emitted while handling the request
    includes it automatically.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:8])

        # Bind the request ID to loguru so all log calls within this
        # request context include it.
        with logger.contextualize(request_id=request_id):
            response = await call_next(request)

        response.headers["X-Request-ID"] = request_id
        return response
