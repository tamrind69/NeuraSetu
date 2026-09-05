"""
video/visual_selector.py

Step 11 of the architecture: Subject-Aware Visual Model.

    Topic -> Visual Selector (LLM) -> {visual_type, elements}
                                            |
                                            v
                              this module renders the actual image

No classifier needs training - the LLM decides *which* visual type
fits (circuit diagram vs graph vs timeline vs code), then simple,
deterministic renderers (matplotlib/PIL) draw it. This keeps output
grounded (no hallucinated diagrams) and fast.
"""
from __future__ import annotations

import os
import textwrap

from ai_teacher.llm_client import chat_json
from ai_teacher.prompts import (
    VISUAL_SELECTOR_BATCH_SYSTEM,
    visual_selector_batch_prompt,
)

VISUAL_SCHEMA = {
    "type": "object",
    "properties": {
        "visual_type": {
            "type": "string",
            "enum": [
                "circuit_diagram",
                "graph",
                "equation",
                "timeline",
                "labeled_diagram",
                "code",
                "flow_diagram",
                "plain_text"
            ]
        },
        "reason": {
            "type": "string"
        },
        "elements": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": [
        "visual_type",
        "reason",
        "elements"
    ]
}

VISUAL_SCHEMA_BATCH = {
    "type": "array",
    "items": VISUAL_SCHEMA,
}

SLIDE_SIZE = (960, 540)
BG = (255, 255, 255)
INK = (30, 30, 40)
ACCENT = (40, 100, 200)


def select_visuals_batch(scenes: list) -> dict[int, dict]:
    """One Gemini call for all scenes instead of one call per scene."""
    payload = [
        {"scene_number": s.scene_number, "subject": s.subject,
         "concept": s.concept, "text": s.text}
        for s in scenes
    ]
    prompt = visual_selector_batch_prompt(payload)

    num_scenes = max(len(scenes), 1)
    batch_max_tokens = min(4000, 200 + (num_scenes * 220))

    results = chat_json(
        VISUAL_SELECTOR_BATCH_SYSTEM,
        prompt,
        max_tokens=batch_max_tokens,
        response_schema=VISUAL_SCHEMA_BATCH,
    )

    by_scene = {}
    for r in results:
        r.setdefault("visual_type", "plain_text")
        r.setdefault("elements", [])
        r.setdefault("reason", "")
        by_scene[r.get("scene_number")] = r

    for s in scenes:
        by_scene.setdefault(
            s.scene_number,
            {"visual_type": "plain_text", "elements": [], "reason": ""},
        )
    return by_scene


def _text_card(title: str, body: str, out_path: str) -> str:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", SLIDE_SIZE, BG)
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 36)
        body_font = ImageFont.truetype("DejaVuSans.ttf", 26)
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    draw.rectangle([0, 0, SLIDE_SIZE[0], 90], fill=ACCENT)
    draw.text((30, 25), title, font=title_font, fill=(255, 255, 255))

    y = 130
    for line in textwrap.wrap(body, width=60):
        draw.text((40, y), line, font=body_font, fill=INK)
        y += 40

    img.save(out_path)
    return out_path


def _flow_diagram(title: str, elements: list[str], out_path: str) -> str:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", SLIDE_SIZE, BG)
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 32)
        body_font = ImageFont.truetype("DejaVuSans.ttf", 22)
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    draw.rectangle([0, 0, SLIDE_SIZE[0], 70], fill=ACCENT)
    draw.text((30, 18), title, font=title_font, fill=(255, 255, 255))

    elements = elements or ["Start", "Process", "End"]
    box_w, box_h = 220, 70
    gap = 40
    total_w = len(elements) * box_w + (len(elements) - 1) * gap
    start_x = max((SLIDE_SIZE[0] - total_w) // 2, 20)
    y = SLIDE_SIZE[1] // 2 - box_h // 2

    x = start_x
    for i, el in enumerate(elements):
        draw.rounded_rectangle([x, y, x + box_w, y + box_h], radius=14, outline=ACCENT, width=3)
        for line_i, line in enumerate(textwrap.wrap(str(el), width=18)[:2]):
            draw.text((x + 14, y + 12 + line_i * 26), line, font=body_font, fill=INK)
        if i < len(elements) - 1:
            arrow_y = y + box_h // 2
            draw.line([x + box_w, arrow_y, x + box_w + gap, arrow_y], fill=INK, width=3)
            draw.polygon(
                [
                    (x + box_w + gap, arrow_y - 8),
                    (x + box_w + gap, arrow_y + 8),
                    (x + box_w + gap + 12, arrow_y),
                ],
                fill=INK,
            )
        x += box_w + gap

    img.save(out_path)
    return out_path


def _timeline(title: str, elements: list[str], out_path: str) -> str:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", SLIDE_SIZE, BG)
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 32)
        body_font = ImageFont.truetype("DejaVuSans.ttf", 20)
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    draw.rectangle([0, 0, SLIDE_SIZE[0], 70], fill=ACCENT)
    draw.text((30, 18), title, font=title_font, fill=(255, 255, 255))

    elements = elements or ["Event 1", "Event 2", "Event 3"]
    y = SLIDE_SIZE[1] // 2
    draw.line([60, y, SLIDE_SIZE[0] - 60, y], fill=INK, width=4)
    n = len(elements)
    for i, el in enumerate(elements):
        x = 60 + i * (SLIDE_SIZE[0] - 120) // max(n - 1, 1)
        draw.ellipse([x - 8, y - 8, x + 8, y + 8], fill=ACCENT)
        for line_i, line in enumerate(textwrap.wrap(str(el), width=16)[:3]):
            draw.text((x - 60, y + 20 + line_i * 24), line, font=body_font, fill=INK)
    img.save(out_path)
    return out_path


def _graph(title: str, out_path: str) -> str:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    fig, ax = plt.subplots(figsize=(9.6, 5.4), dpi=100)
    x = np.linspace(0, 10, 200)
    ax.plot(x, x, label="y = x (example relationship)", color="#2864c8", linewidth=2.5)
    ax.set_title(title)
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
    return out_path


def _code_card(title: str, code_text: str, out_path: str) -> str:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", SLIDE_SIZE, (30, 30, 35))
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 30)
        code_font = ImageFont.truetype("DejaVuSansMono.ttf", 22)
    except Exception:
        title_font = ImageFont.load_default()
        code_font = ImageFont.load_default()

    draw.rectangle([0, 0, SLIDE_SIZE[0], 60], fill=(50, 50, 60))
    draw.text((30, 14), title, font=title_font, fill=(255, 255, 255))

    y = 90
    for line in code_text.splitlines()[:16]:
        draw.text((40, y), line, font=code_font, fill=(140, 220, 140))
        y += 28
    img.save(out_path)
    return out_path


def render_visual(visual: dict, title: str, fallback_text: str, out_path: str) -> str:
    """Dispatch to the right renderer based on the LLM's chosen visual_type."""
    vtype = visual.get("visual_type", "plain_text")
    elements = visual.get("elements", [])
    if vtype in ("circuit_diagram", "labeled_diagram", "flow_diagram"):
        return _flow_diagram(title, elements, out_path)
    if vtype == "timeline":
        return _timeline(title, elements, out_path)
    if vtype == "graph":
        return _graph(title, out_path)
    if vtype == "code":
        return _code_card(title, "\n".join(elements) or fallback_text, out_path)
    if vtype == "equation":
        return _text_card(title, " | ".join(elements) or fallback_text, out_path)
    return _text_card(title, fallback_text, out_path)