"""
backend/main.py

FastAPI app tying the whole architecture together:

    frontend
       |
       v
    backend/main.py  --- rag/ (ingest + retrieve)
       |                 ai_teacher/ (plan + explain + personalize)
       |                 assessment/ (evaluate + adapt + quiz)
       |                 video/ (tts + avatar + visuals -> mp4)
       v
    student

Run with:
    uvicorn backend.main:app --reload --port 8000
"""
from __future__ import annotations

import os
import shutil
import uuid

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from ai_teacher.llm_client import chat
from ai_teacher.personalization import learning_report, load_profile, save_profile
from ai_teacher.planner import plan_lesson
from ai_teacher.prompts import TEACHER_SYSTEM, explain_concept_prompt
from assessment.evaluator import evaluate_answer
from assessment.misconception import decide_next_step
from assessment.quiz import generate_quiz
from backend.models.schemas import (
    AnswerRequest,
    AnswerResponse,
    ExplainRequest,
    ExplainResponse,
    LessonRequest,
    LessonResponse,
    QuizRequest,
    UploadResponse,
    VideoRequest,
)
from rag.ingestion import ingest_file
from rag.retrieval import VectorStore, format_context

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploads")
VIDEO_OUTPUT_DIR = os.getenv("VIDEO_OUTPUT_DIR", "./data/videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="AI Teacher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# 1. Learning material processing (RAG ingestion)
# ---------------------------------------------------------------------------
@app.post("/upload", response_model=UploadResponse)
async def upload_material(file: UploadFile = File(...)):
    session_id = uuid.uuid4().hex[:12]
    dest_path = os.path.join(UPLOAD_DIR, f"{session_id}_{file.filename}")
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        chunks = ingest_file(dest_path, source_name=file.filename)
        store = VectorStore(session_id)
        store.build(chunks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return UploadResponse(session_id=session_id, chunks_indexed=len(chunks), filename=file.filename)


def _retrieve_context(session_id: str | None, query: str, top_k: int = 5) -> str:
    if not session_id:
        return ""
    store = VectorStore(session_id)
    chunks = store.retrieve(query, top_k=top_k)
    return format_context(chunks)


# ---------------------------------------------------------------------------
# 2. Lesson planning (topic OR uploaded material)
# ---------------------------------------------------------------------------
@app.post("/lesson/plan", response_model=LessonResponse)
def create_lesson_plan(req: LessonRequest):
    context = _retrieve_context(req.session_id, req.topic)
    plan = plan_lesson(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        goal=req.goal,
        context=context,
    )
    profile = load_profile(req.student_id, topic=req.topic, level=req.level, language=req.language)
    profile.topic = req.topic
    profile.history.append(req.topic)
    save_profile(profile)
    return LessonResponse(**plan)


# ---------------------------------------------------------------------------
# 5. Human-like teaching: explain a single concept, grounded in RAG context
# ---------------------------------------------------------------------------
@app.post("/lesson/explain", response_model=ExplainResponse)
def explain_concept(req: ExplainRequest):
    context = _retrieve_context(req.session_id, req.concept or req.topic)
    prompt = explain_concept_prompt(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        context=context,
        student_question=req.student_question,
    )
    explanation = chat(TEACHER_SYSTEM, prompt)
    sources = []
    if req.session_id:
        store = VectorStore(req.session_id)
        sources = [f"{c.source} ({c.location})" for c in store.retrieve(req.concept or req.topic, top_k=3)]
    return ExplainResponse(explanation=explanation, sources=sources)


# ---------------------------------------------------------------------------
# 4/5/6. Answer evaluation + misconception detection + adaptive engine
# ---------------------------------------------------------------------------
@app.post("/assess/answer", response_model=AnswerResponse)
def assess_answer(req: AnswerRequest):
    evaluation = evaluate_answer(
        concept=req.concept,
        expected_understanding=req.expected_understanding,
        question=req.question,
        student_answer=req.student_answer,
    )

    profile = load_profile(req.student_id)
    updated_mastery = profile.update_concept(req.concept, evaluation["score"])
    save_profile(profile)

    decision = decide_next_step(
        score=evaluation["score"],
        misconception=evaluation.get("misconception"),
        current_difficulty=profile.current_difficulty,
    )
    return AnswerResponse(evaluation=evaluation, adaptive_decision=decision, updated_mastery=updated_mastery)


# ---------------------------------------------------------------------------
# 13. Assessment and feedback: end-of-lesson quiz + report
# ---------------------------------------------------------------------------
@app.post("/assess/quiz")
def create_quiz(req: QuizRequest):
    return {"questions": generate_quiz(req.topic, req.level, req.concepts, req.num_questions)}


@app.get("/report/{student_id}")
def get_report(student_id: str):
    profile = load_profile(student_id)
    return learning_report(profile)


# ---------------------------------------------------------------------------
# 9. AI Teaching Video: lesson plan -> scenes -> TTS + avatar + visuals -> mp4
# ---------------------------------------------------------------------------
@app.post("/video/generate")
def generate_video(req: VideoRequest):
    from video.video_generator import build_lesson_video, scenes_from_lesson_plan

    context = _retrieve_context(req.session_id, req.topic)
    plan = plan_lesson(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        context=context,
    )

    explanations = {}
    for section in plan["sections"]:
        prompt = explain_concept_prompt(
            topic=req.topic,
            level=req.level,
            language=req.language,
            time_minutes=max(1, section.get("duration", 2)),
            context=context,
            student_question=f"Explain the '{section['title']}' part of {req.topic}.",
        )
        explanations[section["title"]] = chat(TEACHER_SYSTEM, prompt, max_tokens=400)

    scenes = scenes_from_lesson_plan(plan, subject=req.subject, explanations=explanations)
    video_path = build_lesson_video(req.session_id or uuid.uuid4().hex[:8], scenes, language=req.language)

    return {
        "lesson_title": plan["lesson_title"],
        "video_path": video_path,
        "video_url": f"/video/file/{os.path.basename(video_path)}",
    }


@app.get("/video/file/{filename}")
def get_video_file(filename: str):
    path = os.path.join(VIDEO_OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(path, media_type="video/mp4")


# Serve a minimal static frontend if present (see /frontend).
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public")
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
