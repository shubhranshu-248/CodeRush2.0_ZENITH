"""Serialization utilities using orjson for high-performance JSON handling."""

from __future__ import annotations

from typing import Any

import orjson
from fastapi.responses import JSONResponse


def orjson_dumps(obj: Any) -> str:
    """Serialize an object to a JSON string using orjson."""
    return orjson.dumps(obj).decode("utf-8")


def orjson_loads(data: str | bytes) -> Any:
    """Deserialize a JSON string or bytes using orjson."""
    return orjson.loads(data)


class ORJSONResponse(JSONResponse):
    """FastAPI JSONResponse using orjson for serialization."""

    media_type = "application/json"

    def render(self, content: Any) -> bytes:
        return orjson.dumps(
            content,
            option=orjson.OPT_NON_STR_KEYS | orjson.OPT_SERIALIZE_NUMPY,
        )
