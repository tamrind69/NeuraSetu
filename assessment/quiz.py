"""
assessment/quiz.py

End-of-lesson assessment: generates a short quiz covering the
concepts taught, then (via evaluator.py, reused for short-answer
items) produces the final learning report together with
ai_teacher/personalization.py.
"""
from __future__ import annotations

from typing import List, TypedDict

from ai_teacher.llm_client import chat_json
from ai_teacher.prompts import QUIZ_SYSTEM, quiz_prompt


class QuizQuestion(TypedDict):
    id: str
    concept: str
    question: str
    type: str
    options: List[str]
    correct_answer: str


def generate_quiz(topic: str, level: str, concepts: List[str], num_questions: int = 5) -> List[QuizQuestion]:
    prompt = quiz_prompt(topic, level, concepts or [topic], num_questions)
    result = chat_json(QUIZ_SYSTEM, prompt, max_tokens=1200)
    if isinstance(result, dict):
        # tolerate {"questions": [...]}-shaped responses too
        result = result.get("questions", [])
    for i, q in enumerate(result):
        q.setdefault("id", f"q{i + 1}")
        q.setdefault("options", [])
    return result


def grade_mcq(question: QuizQuestion, student_choice: str) -> dict:
    correct = student_choice.strip().lower() == question["correct_answer"].strip().lower()
    return {
        "correct": correct,
        "score": 1.0 if correct else 0.0,
        "concept": question["concept"],
        "misconception": None if correct else "Selected an option inconsistent with the concept.",
        "recommended_action": "continue" if correct else "re_explain",
    }
