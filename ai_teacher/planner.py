"""
ai_teacher/planner.py

Step 2 of the architecture: don't let the LLM freewheel a lesson -
force it through a structured Lesson Planner first.

    {topic, level, language, time_minutes, goal} -> LLM -> structured
    lesson JSON (sections with durations and target concepts)

This plan becomes the backbone the teaching engine iterates over
(ai_teacher/personalization.py tracks progress through it).
"""

from __future__ import annotations

from typing import List, Optional, TypedDict

from ai_teacher.llm_client import chat_json
from ai_teacher.prompts import LESSON_PLANNER_SYSTEM, lesson_planner_prompt


class LessonSection(TypedDict):
    title: str
    duration: int
    concept: str


class LessonPlan(TypedDict):
    lesson_title: str
    duration: int
    sections: List[LessonSection]


LESSON_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "lesson_title": {
            "type": "string"
        },
        "duration": {
            "type": "integer"
        },
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string"
                    },
                    "duration": {
                        "type": "integer"
                    },
                    "concept": {
                        "type": "string"
                    }
                },
                "required": [
                    "title",
                    "duration",
                    "concept"
                ]
            }
        }
    },
    "required": [
        "lesson_title",
        "duration",
        "sections"
    ]
}


def plan_lesson(
    topic: str,
    level: str = "beginner",
    language: str = "English",
    time_minutes: int = 20,
    goal: str = "understand fundamentals",
    context: Optional[str] = "",
) -> LessonPlan:

    prompt = lesson_planner_prompt(
        topic,
        level,
        language,
        time_minutes,
        goal,
        context or "",
    )

    plan = chat_json(
        LESSON_PLANNER_SYSTEM,
        prompt,
        max_tokens=1200,
        response_schema=LESSON_PLAN_SCHEMA,
    )

    # Defensive normalization in case the model returns
    # slightly different or incomplete values.
    sections = plan.get("sections", [])

    for section in sections:
        section.setdefault(
            "concept",
            section.get("title", topic)
        )

        section.setdefault(
            "duration",
            max(
                1,
                time_minutes // max(len(sections), 1)
            )
        )

    plan.setdefault(
        "lesson_title",
        f"Understanding {topic}"
    )

    plan.setdefault(
        "duration",
        time_minutes
    )

    plan["sections"] = sections

    return plan  # type: ignore[return-value]