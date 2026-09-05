"""
backend/main.py

FastAPI app tying the whole architecture together with D-ID video integration:
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

# ---------------------------------------------------------------------------
# RAG
# ---------------------------------------------------------------------------

from rag.ingestion import ingest_document

from rag.embedding import (
    get_embedding_model,
    build_chroma_vectorstore,
    build_bm25_index,
    load_chroma_vectorstore,
    load_bm25_index,
)

from rag.retrieval import (
    LessonRetrievalRequest,
    retrieve_lesson_context,
)

# ---------------------------------------------------------------------------
# D-ID Video Client
# ---------------------------------------------------------------------------

from video.did_client import create_did_talk, poll_did_talk_status


# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploads")
VIDEO_OUTPUT_DIR = os.getenv("VIDEO_OUTPUT_DIR", "./data/videos")
RAG_DATA_DIR = os.getenv("RAG_DATA_DIR", "./data/rag")

os.makedirs(RAG_DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Teacher",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# RAG path helpers
# ---------------------------------------------------------------------------

def _rag_paths(session_id: str):
    base = os.path.join(RAG_DATA_DIR, session_id)

    return {
        "base": base,
        "store": os.path.join(base, "doc_store"),
        "chroma": os.path.join(base, "chroma"),
        "bm25": os.path.join(base, "bm25_index.pkl"),
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ===========================================================================
# 1. Learning material processing (RAG ingestion)
# ===========================================================================

@app.post("/upload", response_model=UploadResponse)
async def upload_material(file: UploadFile = File(...)):
    session_id = uuid.uuid4().hex[:12]

    dest_path = os.path.join(
        UPLOAD_DIR,
        f"{session_id}_{file.filename}",
    )

    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    paths = _rag_paths(session_id)

    try:
        # 1. Ingest PDF -> parent + child chunks
        parent_chunks, child_chunks = ingest_document(
            dest_path,
            store_dir=paths["store"],
        )

        # 2. Load embedding model
        embedding_model = get_embedding_model()

        # 3. Build dense Chroma index
        build_chroma_vectorstore(
            child_chunks,
            embedding_model,
            persist_directory=paths["chroma"],
        )

        # 4. Build sparse BM25 index
        build_bm25_index(
            child_chunks,
            bm25_path=paths["bm25"],
        )

    except (ValueError, RuntimeError, FileNotFoundError) as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    return UploadResponse(
        session_id=session_id,
        chunks_indexed=len(child_chunks),
        filename=file.filename,
    )


# ===========================================================================
# RAG retrieval helpers
# ===========================================================================

def _academic_level(level: str) -> str:
    mapping = {
        "beginner": "College / Undergraduate",
        "intermediate": "College / Undergraduate",
        "advanced": "Self-Paced Professional",
    }

    return mapping.get(level, level)


def _duration_slot(time_minutes: int) -> str:
    if time_minutes <= 15:
        return "10 - 15 mins"

    if time_minutes <= 25:
        return "20 - 25 mins"

    return "40 - 50 mins"


def _retrieve_context(
    session_id: str | None,
    topic: str,
    level: str = "College / Undergraduate",
    language: str = "English",
    time_minutes: int = 20,
    subject_name: str = "General",
    subject_domain: str = "General",
    learning_objectives: list[str] | None = None,
    pedagogical_highlights: list[str] | None = None,
) -> str:

    # No uploaded material -> no RAG context
    if not session_id:
        return ""

    paths = _rag_paths(session_id)

    if not os.path.exists(paths["bm25"]):
        raise HTTPException(
            status_code=404,
            detail=f"RAG index not found for session '{session_id}'.",
        )

    # Load embedding model
    embedding_model = get_embedding_model()

    # Load dense vector store
    vectorstore = load_chroma_vectorstore(
        embedding_model,
        persist_directory=paths["chroma"],
    )

    # Load sparse BM25 index
    bm25, child_chunks = load_bm25_index(
        paths["bm25"],
    )

    objectives = learning_objectives or [
        f"Understand {topic}",
        f"Understand the key concepts of {topic}",
    ]

    request = LessonRetrievalRequest(
        topic_title=topic,
        subject_name=subject_name,
        learning_objectives=objectives,
        subject_domain=subject_domain,
        target_academic_level=_academic_level(level),
        lesson_duration=_duration_slot(time_minutes),
        pedagogical_highlights=pedagogical_highlights or [],
        language=language,
    )

    result = retrieve_lesson_context(
        request=request,
        vectorstore=vectorstore,
        bm25=bm25,
        child_chunks=child_chunks,
        store_dir=paths["store"],
    )

    # Convert retrieved parent Documents into the text
    # expected by the lesson planner / teacher.
    parent_contexts = result.get("parent_contexts", [])

    return "\n\n--- SOURCE SECTION ---\n\n".join(
        doc.page_content
        for doc in parent_contexts
    )


# ===========================================================================
# 2. Lesson planning
# ===========================================================================

@app.post("/lesson/plan", response_model=LessonResponse)
def create_lesson_plan(req: LessonRequest):

    context = _retrieve_context(
        req.session_id,
        req.topic,
    )

    plan = plan_lesson(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        goal=req.goal,
        context=context,
    )

    profile = load_profile(
        req.student_id,
        topic=req.topic,
        level=req.level,
        language=req.language,
    )

    profile.topic = req.topic
    profile.history.append(req.topic)

    save_profile(profile)

    return LessonResponse(**plan)


# ===========================================================================
# 3. Human-like teaching
# Explain a single concept, grounded in RAG context
# ===========================================================================

@app.post("/lesson/explain", response_model=ExplainResponse)
def explain_concept(req: ExplainRequest):

    context = _retrieve_context(
        req.session_id,
        req.concept or req.topic,
    )

    prompt = explain_concept_prompt(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        context=context,
        student_question=req.student_question,
    )

    explanation = chat(
        TEACHER_SYSTEM,
        prompt,
    )

    sources = []

    return ExplainResponse(
        explanation=explanation,
        sources=sources,
    )


# ===========================================================================
# 4/5/6. Answer evaluation + misconception detection + adaptive engine
# ===========================================================================

@app.post("/assess/answer", response_model=AnswerResponse)
def assess_answer(req: AnswerRequest):

    evaluation = evaluate_answer(
        concept=req.concept,
        expected_understanding=req.expected_understanding,
        question=req.question,
        student_answer=req.student_answer,
    )

    profile = load_profile(
        req.student_id,
    )

    updated_mastery = profile.update_concept(
        req.concept,
        evaluation["score"],
    )

    save_profile(profile)

    decision = decide_next_step(
        score=evaluation["score"],
        misconception=evaluation.get("misconception"),
        current_difficulty=profile.current_difficulty,
    )

    return AnswerResponse(
        evaluation=evaluation,
        adaptive_decision=decision,
        updated_mastery=updated_mastery,
    )


# ===========================================================================
# 13. Assessment and feedback
# End-of-lesson quiz + report
# ===========================================================================

@app.post("/assess/quiz")
def create_quiz(req: QuizRequest):

    return {
        "questions": generate_quiz(
            req.topic,
            req.level,
            req.concepts,
            req.num_questions,
        )
    }


@app.get("/report/{student_id}")
def get_report(student_id: str):

    profile = load_profile(
        student_id,
    )

    return learning_report(profile)


# ===========================================================================
# 9. D-ID AI Teaching Video Generation Endpoint
# ===========================================================================

@app.post("/video/generate")
def generate_video(req: VideoRequest):

    # 1. Retrieve RAG context
    context = _retrieve_context(
        req.session_id,
        req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        subject_name=req.subject,
    )

    # 2. Generate lesson plan using Gemini
    plan = plan_lesson(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        context=context,
    )

    # 3. Extract concept text from sections to build the unified script
    full_script = " ".join([section.get("concept", "") for section in plan.get("sections", [])])
    
    # Ensure it fits within free tier limits (~400 words / ~3 minutes)
    if len(full_script.split()) > 400:
        full_script = " ".join(full_script.split()[:400])

    # 4. Submit script to D-ID API
    talk_id = create_did_talk(script_text=full_script)

    # 5. Poll D-ID until the video generation is completed
    video_url = poll_did_talk_status(talk_id)

    # 6. Return response matching expected schema/frontend handling
    return {
        "lesson_title": plan["lesson_title"],
        "video_path": None,  # Hosted remotely on D-ID CDN
        "video_url": video_url,
    }


# ===========================================================================
# Frontend
# ===========================================================================

frontend_dir = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "frontend",
    "public",
)

if os.path.isdir(frontend_dir):
    app.mount(
        "/",
        StaticFiles(
            directory=frontend_dir,
            html=True,
        ),
        name="frontend",
    )