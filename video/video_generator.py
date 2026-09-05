"""
video/video_generator.py

Final step of the architecture:

    Lesson Plan -> Teaching Script -> Visual Instructions -> TTS
    -> Avatar -> Video

Each lesson section becomes one or more "scenes" (see
`ai_teacher_script` shape below). For every scene we:
  1. synthesize narration audio (video/tts.py)
  2. pick + render a subject-aware visual (video/visual_selector.py)
  3. render a lip-synced avatar overlay (video/avatar.py)
  4. composite scene -> concatenate all scenes -> final MP4

This is the "DIY" video provider: fully offline/local except for the
TTS call and the LLM visual-selection call. Swap in D-ID/HeyGen/
Synclabs for a photorealistic avatar by replacing step 3 only.
"""
from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from typing import List, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from video import tts
from video.avatar import make_avatar_frames
from video.visual_selector import select_visuals_batch, render_visual

VIDEO_OUTPUT_DIR = os.getenv("VIDEO_OUTPUT_DIR", "./data/videos")
CANVAS_SIZE = (1280, 720)
AVATAR_SIZE = (260, 260)
FPS = 12


@dataclass
class Scene:
    scene_number: int
    type: str  # "introduction" | "explanation" | "example" | "question"
    text: str  # narration + on-screen caption
    subject: str
    concept: str


def _wrap_caption(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> List[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _build_backdrop(visual_path: str, caption: str, scene_label: str, out_path: str) -> str:
    """Static per-scene background: visual on top, caption + label at bottom.
    The avatar is composited on top of this per-frame later."""
    canvas = Image.new("RGB", CANVAS_SIZE, (250, 250, 252))
    draw = ImageDraw.Draw(canvas)

    visual_img = Image.open(visual_path).convert("RGB")
    visual_img = visual_img.resize((CANVAS_SIZE[0] - 40, 420))
    canvas.paste(visual_img, (20, 20))

    try:
        label_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
        caption_font = ImageFont.truetype("DejaVuSans.ttf", 24)
    except Exception:
        label_font = ImageFont.load_default()
        caption_font = ImageFont.load_default()

    draw.text((24, 450), scene_label.upper(), font=label_font, fill=(40, 100, 200))

    lines = _wrap_caption(draw, caption, caption_font, CANVAS_SIZE[0] - 320)
    y = 480
    for line in lines[:5]:
        draw.text((24, y), line, font=caption_font, fill=(20, 20, 30))
        y += 32

    canvas.save(out_path)
    return out_path


def _composite_scene_clip(backdrop_path: str, audio_path: str, duration: float, work_dir: str):
    from moviepy.editor import ImageClip, ImageSequenceClip, CompositeVideoClip, AudioFileClip

    base = ImageClip(backdrop_path).set_duration(duration)

    avatar_arrays = []
    for _, frame in make_avatar_frames(audio_path, duration, fps=FPS, size=AVATAR_SIZE):
        avatar_arrays.append(np.array(frame))
    if not avatar_arrays:
        avatar_arrays = [np.array(Image.new("RGB", AVATAR_SIZE, (245, 248, 252)))]

    avatar_clip = ImageSequenceClip(avatar_arrays, fps=FPS).set_duration(duration)
    avatar_clip = avatar_clip.set_position(
        (CANVAS_SIZE[0] - AVATAR_SIZE[0] - 20, CANVAS_SIZE[1] - AVATAR_SIZE[1] - 20)
    )

    audio_clip = AudioFileClip(audio_path)
    scene = CompositeVideoClip([base, avatar_clip], size=CANVAS_SIZE).set_duration(duration)
    scene = scene.set_audio(audio_clip)
    return scene


def build_lesson_video(
    session_id: str,
    scenes: List[Scene],
    language: str = "English",
) -> str:
    """
    Renders the full teaching video for a list of scenes and returns
    the output file path.
    """
    from moviepy.editor import concatenate_videoclips

    work_dir = os.path.join(VIDEO_OUTPUT_DIR, "_work", session_id)
    os.makedirs(work_dir, exist_ok=True)

    # ---------------------------------------------------------------
    # One batched Gemini call for ALL scenes' visuals, instead of one
    # call per scene. Keeps /video/generate at a flat, small number of
    # LLM calls regardless of how many scenes the lesson has.
    # ---------------------------------------------------------------
    visuals_by_scene = select_visuals_batch(scenes)

    clips = []
    for scene in scenes:
        audio_path = os.path.join(work_dir, f"scene_{scene.scene_number}.mp3")
        tts.synthesize(scene.text, language, audio_path)

        from moviepy.editor import AudioFileClip

        duration = AudioFileClip(audio_path).duration

        visual = visuals_by_scene[scene.scene_number]
        visual_path = os.path.join(work_dir, f"visual_{scene.scene_number}.png")
        render_visual(visual, title=scene.concept, fallback_text=scene.text, out_path=visual_path)

        backdrop_path = os.path.join(work_dir, f"backdrop_{scene.scene_number}.png")
        _build_backdrop(visual_path, scene.text, scene.type, backdrop_path)

        clips.append(_composite_scene_clip(backdrop_path, audio_path, duration, work_dir))

    if not clips:
        raise ValueError("No scenes to render.")

    final = concatenate_videoclips(clips, method="compose")
    os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(VIDEO_OUTPUT_DIR, f"lesson_{session_id}_{uuid.uuid4().hex[:8]}.mp4")
    final.write_videofile(out_path, fps=FPS, codec="libx264", audio_codec="aac", logger=None)
    return out_path


def scenes_from_lesson_plan(lesson_plan: dict, subject: str, explanations: dict[str, str]) -> List[Scene]:
    """
    Turns a LessonPlan (ai_teacher/planner.py) + a dict of
    {section_title: full_explanation_text} into rendered Scene
    objects ready for build_lesson_video().
    """
    scenes = []
    for i, section in enumerate(lesson_plan.get("sections", []), start=1):
        title = section["title"]
        text = explanations.get(title, f"Let's talk about {title}.")
        scene_type = "introduction" if i == 1 else ("question" if "question" in title.lower() else "explanation")
        scenes.append(
            Scene(
                scene_number=i,
                type=scene_type,
                text=text,
                subject=subject,
                concept=section.get("concept", title),
            )
        )
    return scenes
