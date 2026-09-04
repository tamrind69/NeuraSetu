"""
ai_teacher/llm_client.py

Single place every module (planner, evaluator, misconception
detector, visual selector) calls to talk to "the LLM" -
`chat()` / `chat_json()`. Nothing else in the codebase changed when
Gemini was added: this file now just delegates to
ai_teacher/llm/provider.py, which picks Gemini or Ollama (with
automatic fallback) based on the LLM_PROVIDER env var.

    ai_teacher/planner.py  ---
    assessment/evaluator.py  ---
    assessment/quiz.py         ---> chat()/chat_json() (this file) ---> ai_teacher/llm/provider.py ---> Gemini | Ollama
    video/visual_selector.py ---
    backend/main.py          ---

See ai_teacher/llm/gemini.py and ai_teacher/llm/ollama.py for the
actual provider implementations.
"""
from __future__ import annotations

import json
import re
from typing import Any

from ai_teacher.llm.provider import generate, generate_json

_JSON_FENCE = re.compile(r"^```(?:json)?|```$", re.MULTILINE)


def chat(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    """Plain text completion."""
    return generate(system, user, max_tokens=max_tokens, temperature=temperature)


def chat_json(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.2) -> Any:
    """
    Completion that is expected to return ONLY a JSON object/array.
    Uses the active provider's native JSON mode where available
    (Gemini), and defensively strips markdown fences either way in
    case a provider (e.g. Ollama) ignores the instruction.
    """
    system_with_instruction = system + "\n\nRespond with ONLY valid JSON. No prose, no markdown fences."
    raw = generate_json(system_with_instruction, user, max_tokens=max_tokens, temperature=temperature)
    cleaned = _JSON_FENCE.sub("", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # one retry with an explicit correction nudge
        raw2 = generate_json(
            system_with_instruction,
            user + "\n\nYour previous reply was not valid JSON. Return ONLY valid JSON.",
            max_tokens=max_tokens,
            temperature=0.0,
        )
        cleaned2 = _JSON_FENCE.sub("", raw2).strip()
        try:
            return json.loads(cleaned2)
        except json.JSONDecodeError:
            raise ValueError(f"Model did not return valid JSON: {raw[:300]}") from e
