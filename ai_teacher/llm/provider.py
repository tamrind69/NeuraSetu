"""
ai_teacher/llm/provider.py

Central LLM switchboard.

Gemini is the primary provider.
Ollama is an optional fallback when explicitly enabled.
"""

from __future__ import annotations

import os

from .gemini import (
    generate_json_with_gemini,
    generate_with_gemini,
)
from .ollama import generate_with_ollama


LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()

# Set this to true only if Ollama is actually installed and running.
OLLAMA_FALLBACK = (
    os.getenv("OLLAMA_FALLBACK", "false").strip().lower()
    in ("1", "true", "yes", "on")
)


def _ollama():
    """Call Ollama only when it has explicitly been enabled."""
    return generate_with_ollama


def generate(
    system: str,
    user: str,
    max_tokens: int = 1200,
    temperature: float = 0.4,
) -> str:

    if LLM_PROVIDER == "gemini":

        try:
            return generate_with_gemini(
                system,
                user,
                max_tokens,
                temperature,
            )

        except Exception as e:

            # Do not hide Gemini quota/API errors behind an
            # unrelated Ollama connection error.
            if not OLLAMA_FALLBACK:
                raise RuntimeError(
                    f"Gemini request failed: {e}\n\n"
                    "Ollama fallback is disabled."
                ) from e

            print(
                f"[llm/provider] Gemini failed ({e}); "
                "falling back to Ollama."
            )

            return _ollama()(
                system,
                user,
                max_tokens,
                temperature,
            )

    if LLM_PROVIDER == "ollama":

        return generate_with_ollama(
            system,
            user,
            max_tokens,
            temperature,
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER: {LLM_PROVIDER}. "
        "Use 'gemini' or 'ollama'."
    )


def generate_json(
    system: str,
    user: str,
    max_tokens: int = 1200,
    temperature: float = 0.2,
    response_schema=None,
) -> str:

    if LLM_PROVIDER == "gemini":

        try:
            return generate_json_with_gemini(
                system,
                user,
                max_tokens,
                temperature,
                response_schema=response_schema,
            )

        except Exception as e:

            if not OLLAMA_FALLBACK:
                raise RuntimeError(
                    f"Gemini JSON request failed: {e}\n\n"
                    "Ollama fallback is disabled."
                ) from e

            print(
                f"[llm/provider] Gemini JSON call failed ({e}); "
                "falling back to Ollama."
            )

            return generate_with_ollama(
                system,
                user,
                max_tokens,
                temperature,
            )

    if LLM_PROVIDER == "ollama":

        return generate_with_ollama(
            system,
            user,
            max_tokens,
            temperature,
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER: {LLM_PROVIDER}. "
        "Use 'gemini' or 'ollama'."
    )