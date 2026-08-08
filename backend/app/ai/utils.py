"""Shared utilities for the AI layer."""

from __future__ import annotations

import json
import re


def extract_json(text: str) -> dict:
    """Extract a JSON object from plain text or markdown fenced code blocks.

    Handles three common LLM output patterns:
    1. Raw JSON starting with ``{``
    2. Markdown fenced blocks (```json ... ``` or ``` ... ```)
    3. JSON embedded in surrounding prose (first ``{`` to last ``}``)
    """
    text = text.strip()
    if text.startswith("{"):
        return json.loads(text)

    # Look for ```json ... ``` or ``` ... ``` blocks.
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())

    # Last resort: find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])

    raise ValueError("No JSON object found in LLM response")
