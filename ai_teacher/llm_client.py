"""
ai_teacher/llm_client.py

Single place every module (planner, evaluator, misconception
detector, visual selector) calls to talk to "the LLM" -
chat() / chat_json().

Delegates to:
    ai_teacher/llm/provider.py

which selects Gemini or Ollama based on LLM_PROVIDER.
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
    temperature: float = 0.4,
) -> str:
    """Plain text completion."""

    return generate(
        system,
        user,
        max_tokens=max_tokens,
        temperature=temperature,
    )


def _clean_json_text(text: str) -> str:
    """
    Remove common formatting around JSON.

    Handles:
        ```json
        {...}
        ```

    and accidental whitespace.
    """

    if not text:
        return ""

    text = text.strip()

    # Remove markdown code fences.
    text = re.sub(
        r"^```(?:json|JSON)?\s*",
        "",
        text,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    return text.strip()


def _extract_json(text: str) -> str | None:
    """
    Find the first complete JSON object or array in arbitrary text.

    Unlike the old implementation, this understands nested
    dictionaries/lists and strings containing braces.
    """

    text = _clean_json_text(text)

    if not text:
        return None

    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    start_positions = []

    object_start = text.find("{")
    array_start = text.find("[")

    if object_start != -1:
        start_positions.append(object_start)

    if array_start != -1:
        start_positions.append(array_start)

    if not start_positions:
        return None

    start = min(start_positions)

    stack: list[str] = []

    in_string = False
    escape = False

    opening = text[start]

    if opening == "{":
        stack.append("}")
    elif opening == "[":
        stack.append("]")
    else:
        return None

    for i in range(start + 1, len(text)):

        char = text[i]

        if in_string:

            if escape:
                escape = False
                continue

            if char == "\\":
                escape = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "{":
            stack.append("}")

        elif char == "[":
            stack.append("]")

        elif char == "}" or char == "]":

            if not stack:
                return None

            expected = stack[-1]

            if char != expected:
                return None

            stack.pop()

            if not stack:
                return text[start:i + 1]

    return None


def _parse_json(text: str) -> Any:
    """
    Parse JSON robustly.

    Raises JSONDecodeError if valid JSON cannot be extracted.
    """

    cleaned = _clean_json_text(text)

    try:
        return json.loads(cleaned)

    except json.JSONDecodeError:
        pass

    candidate = _extract_json(cleaned)

    if candidate is not None:
        try:
            return json.loads(candidate)

        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError(
        "Model response did not contain valid complete JSON",
        cleaned,
        0,
    )


def chat_json(
    system: str,
    user: str,
    max_tokens: int = 2000,
    temperature: float = 0.2,
    response_schema=None,
) -> Any:
    """
    Generate and parse JSON from the LLM.

    Automatically retries once if the first response is invalid.
    """

    system_with_instruction = system + """

IMPORTANT JSON OUTPUT RULES:

1. Return ONLY valid JSON object or array.
2. Do NOT write explanations.
3. Do NOT use markdown.
4. Do NOT use ```json fences.
5. Do NOT write anything before or after the JSON.
6. Make sure every { has a matching }.
7. Make sure every [ has a matching ].
8. Make sure every JSON string is closed with ".
9. Ensure your response is complete and not truncated.
"""

    raw = generate_json(
        system_with_instruction,
        user,
        max_tokens=max_tokens,
        temperature=temperature,
        response_schema=response_schema,
    )

    try:
        return _parse_json(raw)

    except json.JSONDecodeError as first_error:

        retry_user = user + """

CRITICAL JSON CORRECTION:

Your previous response was invalid or cut off.
Generate the COMPLETE answer again matching the required schema.

Return ONLY complete, valid JSON.
The response must begin with { or [ and end with } or ].
There must be absolutely NO text outside the JSON.
"""

        retry_max_tokens = max(
            max_tokens * 2,
            2500,
        )

        raw2 = generate_json(
            system_with_instruction,
            retry_user,
            max_tokens=retry_max_tokens,
            temperature=0.0,
            response_schema=response_schema,
        )

        try:
            return _parse_json(raw2)

        except json.JSONDecodeError as second_error:
            print("\n" + "=" * 70)
            print("LLM JSON PARSING FAILED")
            print("=" * 70)

            print("\nFIRST RESPONSE:")
            print(raw)

            print("\nRETRY RESPONSE:")
            print(raw2)

            print("\n" + "=" * 70)

            raise ValueError(
                "Model did not return valid complete JSON.\n\n"
                f"First response:\n{raw}\n\n"
                f"Retry response:\n{raw2}"
            ) from second_error