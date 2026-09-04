"""
ai_teacher/llm/gemini.py

Cloud LLM backend via the Gemini API (Google AI Studio / Gemini
Developer API), using the official `google-genai` SDK.

IMPORTANT: the "AI Studio app" link you get from a shared AI Studio
build (something like https://ai.studio/apps/<id>) is a *hosted
prototype UI*, not an API endpoint - there is nothing for a backend
to "connect to" at that URL. What actually gets reused from AI Studio
is the API KEY (Dashboard -> API Keys -> Create API Key) and,
optionally, the MODEL NAME and system-prompt/generation-config you
tuned in that app's "get code" panel. That model name and config are
what belong in this file / your .env - not the app URL itself.

Set GEMINI_API_KEY (and optionally GEMINI_MODEL) in your .env. Never
put the key in frontend code - it is only ever read here, server-side.
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


def _client():
    from google import genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com "
            "(Dashboard -> API Keys -> Create API Key) and add it to your .env."
        )
    return genai.Client(api_key=api_key)


def generate_with_gemini(
    system: str, user: str, max_tokens: int = 1200, temperature: float = 0.4
) -> str:
    """Plain text completion via the Gemini API."""
    from google.genai import types

    client = _client()
    response = client.models.generate_content(
        model=MODEL,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            temperature=temperature,
        ),
    )
    if not response.text:
        # Gemini returns no text on some safety-block / empty-candidate cases;
        # surface that clearly instead of returning None downstream.
        raise RuntimeError(f"Gemini returned no text (finish_reason: {response.candidates[0].finish_reason if response.candidates else 'unknown'})")
    return response.text


def generate_json_with_gemini(
    system: str,
    user: str,
    max_tokens: int = 1200,
    temperature: float = 0.2,
    response_schema=None,
) -> str:
    """
    Generate JSON using Gemini's native structured-output mode.
    """

    from google.genai import types

    client = _client()

    config_kwargs = {
        "system_instruction": system,
        "max_output_tokens": max_tokens,
        "temperature": temperature,
        "response_mime_type": "application/json",
    }

    if response_schema is not None:
        config_kwargs["response_schema"] = response_schema

    response = client.models.generate_content(
        model=MODEL,
        contents=user,
        config=types.GenerateContentConfig(**config_kwargs),
    )

    if not response.text:
        raise RuntimeError(
            "Gemini returned no text for a JSON-mode request."
        )

    return response.text