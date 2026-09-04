"""
ai_teacher/llm/provider.py

The one switchboard every other module talks to. Nothing outside
ai_teacher/llm/ should import gemini.py or ollama.py directly - that
way adding a third provider later (or changing the fallback order)
is a one-file change.

    LLM_PROVIDER=gemini (default) -> try Gemini first, fall back to
    Ollama if the Gemini call raises for any reason (no key, network
    blip, rate limit, safety block, etc.) so a demo never goes fully
    dark mid-session.

    LLM_PROVIDER=ollama -> use Ollama only (useful offline / while
    iterating without burning API quota).
"""
from __future__ import annotations

import os

from .gemini import generate_json_with_gemini, generate_with_gemini
from .ollama import generate_with_ollama

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()


def generate(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    if LLM_PROVIDER == "gemini":
        try:
            return generate_with_gemini(system, user, max_tokens, temperature)
        except Exception as e:
            print(f"[llm/provider] Gemini failed ({e}); falling back to Ollama.")
            return generate_with_ollama(system, user, max_tokens, temperature)
    return generate_with_ollama(system, user, max_tokens, temperature)


def generate_json(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.2) -> str:
    """Same fallback behaviour, but uses Gemini's native JSON mode when
    Gemini is the active provider (see gemini.generate_json_with_gemini)."""
    if LLM_PROVIDER == "gemini":
        try:
            return generate_json_with_gemini(system, user, max_tokens, temperature)
        except Exception as e:
            print(f"[llm/provider] Gemini JSON call failed ({e}); falling back to Ollama.")
            return generate_with_ollama(system, user, max_tokens, temperature)
    return generate_with_ollama(system, user, max_tokens, temperature)
