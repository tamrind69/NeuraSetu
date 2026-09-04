"""
ai_teacher/llm/ollama.py

Local LLM backend via Ollama. Kept as the offline/no-API-key fallback
so a demo never goes fully dark if a cloud provider (Gemini) has an
outage or rate limit mid-demo.

Requires Ollama running locally: `ollama serve` (and the model pulled,
e.g. `ollama pull mistral`).
"""
from __future__ import annotations

import os

import requests

MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def _check_running() -> None:
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        resp.raise_for_status()
    except Exception as e:
        raise RuntimeError(
            f"Ollama is not running at {OLLAMA_BASE_URL}. "
            f"Start it with `ollama serve` or ensure it's running as a service. Error: {e}"
        )


def generate_with_ollama(
    system: str, user: str, max_tokens: int = 1200, temperature: float = 0.4
) -> str:
    """Plain text completion via a local Ollama model."""
    _check_running()

    prompt = f"{system}\n\nUser: {user}"

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
                "num_predict": max_tokens,
            },
            timeout=300,  # local models can be slow
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip()
    except Exception as e:
        raise RuntimeError(f"Ollama request failed: {e}")
