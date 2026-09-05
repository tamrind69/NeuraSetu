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

from ai_teacher.llm_client import chat, chat_json
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

    # The old VectorStore retrieval has been removed.
    #
    # The project now uses the new:
    #     ChromaDB + BM25 + parent retrieval
    #
    # Therefore, don't reference the old VectorStore class here.
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
# 9. AI Teaching Video
# Lesson plan -> scenes -> TTS + avatar + visuals -> mp4
# ===========================================================================

@app.post("/video/generate")
def generate_video(req: VideoRequest):

    from video.video_generator import (
        build_lesson_video,
        scenes_from_lesson_plan,
    )

    # ---------------------------------------------------------------
    # 1. Retrieve RAG context
    # ---------------------------------------------------------------

    context = _retrieve_context(
        req.session_id,
        req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        subject_name=req.subject,
    )

    # ---------------------------------------------------------------
    # 2. Generate lesson plan
    # ---------------------------------------------------------------

    plan = plan_lesson(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        goal="understand the fundamentals",
        context=context,
    )

    # ---------------------------------------------------------------
    # 3. Generate explanations
    #
    # ONE Gemini call for the whole lesson, but asking for a
    # distinct, section-specific explanation per section (returned
    # as structured JSON) instead of one shared paragraph reused
    # for every scene.
    # ---------------------------------------------------------------

    EXPLANATION_SCHEMA = {
        "type": "object",
        "properties": {
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "explanation": {"type": "string"},
                    },
                    "required": ["title", "explanation"],
                },
            }
        },
        "required": ["sections"],
    }

    explanation_prompt = explain_concept_prompt(
        topic=req.topic,
        level=req.level,
        language=req.language,
        time_minutes=req.time_minutes,
        context=context,
        student_question=(
            f"For each of the following sections of a lesson on "
            f"{req.topic}, write a distinct, section-specific "
            f"explanation (1-2 sentences, no more than 40 words, "
            f"self-contained, no references to 'as mentioned above' "
            f"or other sections):\n\n"
            + "\n".join(
                f"- {section['title']}: {section['concept']}"
                for section in plan["sections"]
            )
        ),
    )

    # Scale the token budget with lesson length so the JSON response
    # doesn't get truncated mid-generation for lessons with more
    # sections (a fixed budget only worked for very short plans).
    num_sections = max(len(plan["sections"]), 1)
    explanation_max_tokens = min(3000, 300 + (num_sections * 350))

    explanation_result = chat_json(
        TEACHER_SYSTEM,
        explanation_prompt,
        max_tokens=explanation_max_tokens,
        response_schema=EXPLANATION_SCHEMA,
    )

    # ---------------------------------------------------------------
    # 4. Map each section title to its own explanation.
    #
    # scenes_from_lesson_plan() expects explanations keyed by
    # section title, so preserve that interface.
    # ---------------------------------------------------------------

    explanations = {
        item["title"]: item["explanation"]
        for item in explanation_result.get("sections", [])
    }

    for section in plan["sections"]:
        explanations.setdefault(
            section["title"],
            f"Let's talk about {section['title']}.",
        )

    # ---------------------------------------------------------------
    # 5. Convert lesson plan into video scenes
    # ---------------------------------------------------------------

    scenes = scenes_from_lesson_plan(
        plan,
        subject=req.subject,
        explanations=explanations,
    )

    # ---------------------------------------------------------------
    # 6. Generate the actual video
    # ---------------------------------------------------------------

    video_path = build_lesson_video(
        req.session_id or uuid.uuid4().hex[:8],
        scenes,
        language=req.language,
    )

    # ---------------------------------------------------------------
    # 7. Return video information
    # ---------------------------------------------------------------

    return {
        "lesson_title": plan["lesson_title"],
        "video_path": video_path,
        "video_url": f"/video/file/{os.path.basename(video_path)}",
    }

# ===========================================================================
# Video file serving
# ===========================================================================

@app.get("/video/file/{filename}")
def get_video_file(filename: str):

    path = os.path.join(
        VIDEO_OUTPUT_DIR,
        filename,
    )

    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    return FileResponse(
        path,
        media_type="video/mp4",
    )


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