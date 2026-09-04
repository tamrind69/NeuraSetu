from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    session_id: str
    chunks_indexed: int
    filename: str


class LessonRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Set if teaching from uploaded material")
    student_id: str = "demo_student"
    topic: str
    level: str = "beginner"
    language: str = "English"
    time_minutes: int = 20
    goal: str = "understand fundamentals"


class LessonResponse(BaseModel):
    lesson_title: str
    duration: int
    sections: List[dict]


class ExplainRequest(BaseModel):
    session_id: Optional[str] = None
    topic: str
    concept: str
    level: str = "beginner"
    language: str = "English"
    time_minutes: int = 5
    student_question: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str
    sources: List[str] = []


class AnswerRequest(BaseModel):
    student_id: str = "demo_student"
    concept: str
    expected_understanding: str
    question: str
    student_answer: str


class AnswerResponse(BaseModel):
    evaluation: dict
    adaptive_decision: dict
    updated_mastery: float


class QuizRequest(BaseModel):
    topic: str
    level: str = "beginner"
    concepts: List[str] = []
    num_questions: int = 5


class VideoRequest(BaseModel):
    session_id: str
    topic: str
    level: str = "beginner"
    language: str = "English"
    time_minutes: int = 5
    subject: str = "general"


class ReportRequest(BaseModel):
    student_id: str = "demo_student"
