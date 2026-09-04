"""
video/tts.py

Scene text -> spoken audio (multilingual).

Uses gTTS out of the box (needs internet, no API key, supports
Hindi/English/and 100+ languages - good enough for a hackathon demo).
The function signature is provider-agnostic on purpose: swap in
Azure/ElevenLabs/Coqui here later without touching video_generator.py.
"""
from __future__ import annotations

import os

# Map the language names used elsewhere in the app to gTTS language codes.
LANG_CODES = {
    "english": "en",
    "hindi": "hi",
    "hinglish": "hi",  # gTTS has no code-mixed voice; Hindi voice reads Hinglish reasonably
    "spanish": "es",
    "french": "fr",
    "tamil": "ta",
    "telugu": "te",
    "bengali": "bn",
    "marathi": "mr",
    "gujarati": "gu",
    "kannada": "kn",
}


def synthesize(text: str, language: str, out_path: str) -> str:
    """
    Renders `text` as speech in `language` to `out_path` (mp3).
    Returns the path for convenience.
    """
    from gtts import gTTS

    lang_code = LANG_CODES.get(language.strip().lower(), "en")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    tts = gTTS(text=text, lang=lang_code)
    tts.save(out_path)
    return out_path


def estimate_duration_seconds(text: str, words_per_minute: int = 140) -> float:
    """Used to pace slide/avatar timing before the audio file even exists."""
    word_count = max(len(text.split()), 1)
    return (word_count / words_per_minute) * 60
