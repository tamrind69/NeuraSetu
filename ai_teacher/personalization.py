"""
ai_teacher/personalization.py

Step 3 of the architecture: the Learner Model. This is what makes the
system different from a stateless chatbot - every answer the student
gives updates a per-concept mastery score, which the adaptive engine
(assessment/misconception.py) reads to decide what happens next.

No neural network needed - an exponentially-weighted mastery score
per concept is sufficient (and transparent, which is good for the
"assessment methodology" write-up too).
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from typing import Dict, List

DATA_DIR = os.getenv("DATA_DIR", "./data")
PROFILE_DIR = os.path.join(DATA_DIR, "profiles")

MASTERY_LEARNING_RATE = 0.4  # how much one new answer moves the mastery estimate


@dataclass
class ConceptState:
    mastery: float = 0.3  # prior: assume partial unfamiliarity


@dataclass
class LearnerProfile:
    student_id: str
    level: str = "beginner"
    language: str = "English"
    topic: str = ""
    concepts: Dict[str, ConceptState] = field(default_factory=dict)
    recent_scores: List[float] = field(default_factory=list)
    current_difficulty: int = 2  # 1..5
    history: List[str] = field(default_factory=list)  # topics studied

    # -- mastery update ------------------------------------------------
    def update_concept(self, concept: str, score: float) -> float:
        state = self.concepts.setdefault(concept, ConceptState())
        state.mastery = (
            1 - MASTERY_LEARNING_RATE
        ) * state.mastery + MASTERY_LEARNING_RATE * score
        state.mastery = max(0.0, min(1.0, state.mastery))
        self.recent_scores.append(score)
        self.recent_scores = self.recent_scores[-10:]
        self._adjust_difficulty()
        return state.mastery

    def _adjust_difficulty(self) -> None:
        if len(self.recent_scores) < 2:
            return
        avg = sum(self.recent_scores[-3:]) / len(self.recent_scores[-3:])
        if avg >= 0.8:
            self.current_difficulty = min(5, self.current_difficulty + 1)
        elif avg < 0.5:
            self.current_difficulty = max(1, self.current_difficulty - 1)

    @property
    def weak_concepts(self) -> List[str]:
        return [c for c, s in self.concepts.items() if s.mastery < 0.5]

    @property
    def strong_concepts(self) -> List[str]:
        return [c for c, s in self.concepts.items() if s.mastery >= 0.7]

    # -- serialization --------------------------------------------------
    def to_dict(self) -> dict:
        d = asdict(self)
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "LearnerProfile":
        concepts = {k: ConceptState(**v) for k, v in d.get("concepts", {}).items()}
        d = {**d, "concepts": concepts}
        return cls(**d)


def _path(student_id: str) -> str:
    os.makedirs(PROFILE_DIR, exist_ok=True)
    safe_id = "".join(c for c in student_id if c.isalnum() or c in "-_")
    return os.path.join(PROFILE_DIR, f"{safe_id}.json")


def load_profile(student_id: str, topic: str = "", level: str = "beginner",
                  language: str = "English") -> LearnerProfile:
    path = _path(student_id)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return LearnerProfile.from_dict(json.load(f))
    return LearnerProfile(student_id=student_id, topic=topic, level=level, language=language)


def save_profile(profile: LearnerProfile) -> None:
    with open(_path(profile.student_id), "w", encoding="utf-8") as f:
        json.dump(profile.to_dict(), f, indent=2, ensure_ascii=False)


def learning_report(profile: LearnerProfile) -> dict:
    scores = profile.recent_scores or [0]
    return {
        "topic": profile.topic,
        "score_percent": round(100 * sum(scores) / len(scores)),
        "strong_areas": profile.strong_concepts,
        "needs_improvement": profile.weak_concepts,
        "recommendation": (
            f"Revise {', '.join(profile.weak_concepts)}."
            if profile.weak_concepts
            else "Ready to move on to the next topic."
        ),
    }
