"""
ai_teacher/llm_client.py

Updated to increase default token ceilings and improve robustness 
against truncated JSON payloads from cloud LLM providers.
"""
from __future__ import annotations

import json
import re
from typing import Any

from ai_teacher.llm.provider import generate, generate_json


def chat(
    system: str,
    user: str,
    max_tokens: int = 2000,
    temperature: float = 0.4
) -> str:
    """Plain text completion."""
    return generate(
        system,
        user,
        max_tokens=max_tokens,
        temperature=temperature
    )


def chat_json(
    system: str,
    user: str,
    max_tokens: int = 2000,
    temperature: float = 0.2,
    response_schema=None,
) -> Any:
    system_with_instruction = system + """

IMPORTANT:
Return ONLY one valid JSON object or JSON array.
Do NOT explain your answer.
Do NOT include markdown.
Do NOT include ```json or ``` fences.
Do NOT write anything before or after the JSON.
Ensure your response is complete and not truncated.
"""

    raw = generate_json(
        system_with_instruction,
        user,
        max_tokens=max_tokens,
        temperature=temperature,
        response_schema=response_schema,
    )

    def parse_json(text: str) -> Any:
        text = text.strip()

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            candidate = text[start:end + 1]
            return json.loads(candidate)

        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1 and end > start:
            candidate = text[start:end + 1]
            return json.loads(candidate)

        raise json.JSONDecodeError(
            "No valid JSON found",
            text,
            0,
        )

    try:
        return parse_json(raw)

    except json.JSONDecodeError as first_error:

        retry_user = user + """

CRITICAL CORRECTION:
Your previous response was invalid or cut off.
Return ONLY complete, valid JSON matching the required schema.
The response must begin with { or [ and end with } or ].
There must be absolutely NO text outside the JSON.
"""

        raw2 = generate_json(
            system_with_instruction,
            retry_user,
            max_tokens=max_tokens,
            temperature=0.0,
            response_schema=response_schema,
        )

        try:
            return parse_json(raw2)

        except json.JSONDecodeError:
            raise ValueError(
                f"Model did not return valid JSON.\n"
                f"First response:\n{raw[:500]}\n\n"
                f"Retry response:\n{raw2[:500]}"
            ) from first_error