"""
video/avatar.py

A simple, dependency-light "AI avatar": a procedurally drawn
friendly-teacher face whose mouth opens and closes in sync with the
narration's audio envelope (basic viseme approximation), plus a slow
blink and a subtle head-bob so it doesn't look static.

This is the DIY/offline avatar provider. For a stronger visual
result, set AVATAR_PROVIDER=did|heygen|synclabs in .env and implement
`render_avatar_clip_via_vendor()` below using that vendor's API - the
rest of the pipeline (video_generator.py) doesn't need to change.
"""
from __future__ import annotations

import math
import os
from typing import Tuple

import numpy as np
from PIL import Image, ImageDraw

AVATAR_PROVIDER = os.getenv("AVATAR_PROVIDER", "diy")

FACE_SKIN = (255, 224, 189)
FACE_OUTLINE = (120, 90, 60)
BG = (245, 248, 252)
SHIRT = (60, 110, 200)


def _draw_face(size: Tuple[int, int], mouth_open: float, blink: bool, bob: int) -> Image.Image:
    """mouth_open in [0,1]; blink True closes the eyes for one frame."""
    w, h = size
    img = Image.new("RGB", size, BG)
    draw = ImageDraw.Draw(img)

    cx, cy = w // 2, h // 2 + bob
    face_r = int(min(w, h) * 0.30)

    # shoulders/shirt
    draw.ellipse(
        [cx - face_r * 2, cy + int(face_r * 1.3), cx + face_r * 2, cy + face_r * 3],
        fill=SHIRT,
    )

    # face
    draw.ellipse([cx - face_r, cy - face_r, cx + face_r, cy + face_r], fill=FACE_SKIN, outline=FACE_OUTLINE, width=3)

    # eyes
    eye_dx = int(face_r * 0.42)
    eye_y = cy - int(face_r * 0.15)
    eye_r = int(face_r * 0.12)
    for sign in (-1, 1):
        ex = cx + sign * eye_dx
        if blink:
            draw.line([ex - eye_r, eye_y, ex + eye_r, eye_y], fill=FACE_OUTLINE, width=3)
        else:
            draw.ellipse([ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r], fill=(255, 255, 255), outline=FACE_OUTLINE, width=2)
            draw.ellipse([ex - eye_r * 0.5, eye_y - eye_r * 0.5, ex + eye_r * 0.5, eye_y + eye_r * 0.5], fill=(40, 30, 20))

    # eyebrows (friendly, slightly raised)
    for sign in (-1, 1):
        ex = cx + sign * eye_dx
        draw.line(
            [ex - eye_r, eye_y - eye_r * 2, ex + eye_r, eye_y - eye_r * 2.6],
            fill=FACE_OUTLINE,
            width=4,
        )

    # nose
    draw.line([cx, cy - int(face_r * 0.05), cx - int(face_r * 0.05), cy + int(face_r * 0.15)], fill=FACE_OUTLINE, width=2)

    # mouth: height scales with mouth_open (viseme approximation)
    mouth_w = int(face_r * 0.55)
    mouth_h = int(face_r * (0.08 + 0.35 * mouth_open))
    mouth_y = cy + int(face_r * 0.45)
    draw.ellipse(
        [cx - mouth_w // 2, mouth_y - mouth_h // 2, cx + mouth_w // 2, mouth_y + mouth_h // 2],
        fill=(150, 40, 40) if mouth_open > 0.15 else (170, 90, 90),
        outline=FACE_OUTLINE,
        width=2,
    )

    return img


def audio_envelope(audio_path: str, fps: int, duration: float) -> np.ndarray:
    """Coarse RMS envelope of the narration audio, resampled to `fps`, used to
    drive the mouth-open amount frame by frame (cheap lip-sync approximation)."""
    try:
        from moviepy.editor import AudioFileClip

        clip = AudioFileClip(audio_path)
        n_frames = max(int(duration * fps), 1)
        env = np.zeros(n_frames)
        for i in range(n_frames):
            t = min(i / fps, max(clip.duration - 1e-3, 0))
            frame = clip.get_frame(t)
            env[i] = float(np.abs(frame).mean())
        clip.close()
        if env.max() > 0:
            env = env / env.max()
        return env
    except Exception:
        # Fallback: alternate mouth positions rhythmically if audio analysis fails.
        n_frames = max(int(duration * fps), 1)
        return np.abs(np.sin(np.linspace(0, duration * 6, n_frames)))


def make_avatar_frames(audio_path: str, duration: float, fps: int = 12, size=(480, 480)):
    """Generator yielding (t, PIL.Image) frames for the given duration."""
    env = audio_envelope(audio_path, fps, duration)
    n_frames = len(env)
    for i in range(n_frames):
        t = i / fps
        blink = (int(t * 2) % 45 == 0)  # brief periodic blink
        bob = int(4 * math.sin(t * 2))
        mouth_open = float(env[i]) if env[i] > 0.05 else 0.0
        yield t, _draw_face(size, mouth_open=mouth_open, blink=blink, bob=bob)
