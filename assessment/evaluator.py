"""
assessment/evaluator.py

Step 4 of the architecture: Answer Evaluation.

The teacher never just returns "Wrong." It returns a structured
evaluation: correctness, partial-credit score, confidence, and -
critically - the misconception behind a wrong answer, produced by
using the LLM as a semantic evaluator (Step 5 in the design notes).
"""
from __future__ import annotations

from typing import Optional, TypedDict

from ai_teacher.llm_client import chat_json
from ai_teacher.prompts import EVALUATOR_SYSTEM, evaluate_answer_prompt


class Evaluation(TypedDict):
    correct: bool
    score: float
    concept: str
    misconception: Optional[str]
    missing_concept: Optional[str]
    confidence: float
    recommended_action: str


def evaluate_answer(
    concept: str, expected_understanding: str, question: str, student_answer: str
) -> Evaluation:
    prompt = evaluate_answer_prompt(concept, expected_understanding, question, student_answer)
    result = chat_json(EVALUATOR_SYSTEM, prompt, max_tokens=500)

    # Defensive defaults so a slightly-off LLM response never crashes the app.
    result.setdefault("correct", False)
    result.setdefault("score", 0.0)
    result.setdefault("concept", concept)
    result.setdefault("misconception", None)
    result.setdefault("missing_concept", None)
    result.setdefault("confidence", 0.5)
    result.setdefault("recommended_action", "re_explain")
    result["score"] = max(0.0, min(1.0, float(result["score"])))
    return result  # type: ignore[return-value]
