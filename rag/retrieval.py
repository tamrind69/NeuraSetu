"""
retreival.py — NeuraSetu AI Teacher
=====================================
Advanced Hybrid Retrieval & Re-ranking Pipeline.

Responsibilities
----------------
- Accept the frontend UI payload (via ``LessonRetrievalRequest`` Pydantic schema).
- Run Hybrid Search: dense (ChromaDB) + sparse (BM25) with Reciprocal Rank
  Fusion (RRF) to produce top-15 candidate child chunks.
- Cross-Encoder Re-ranking via FlashRank to compress to top-k.
- Resolve child chunk ``parent_id`` → full parent context from LocalFileStore.
- Apply pedagogical metadata filters & scoring biases based on:
    * target_academic_level, lesson_duration, pedagogical_highlights, language.
- Agentic Query Transforms:
    * ``rewrite_misconception_query`` — steers away from a student's flawed
      premise toward the underlying first principle.
    * ``decompose_learning_objectives`` — explodes a list of learning objectives
      into targeted sub-queries for structured context retrieval.

Dependencies (pip)
------------------
    langchain langchain-community pydantic rank-bm25 flashrank chromadb
    huggingface-hub sentence-transformers python-dotenv
"""

from __future__ import annotations

import logging
import os
from collections import defaultdict
from typing import Any, Dict, List, Literal, Optional, Tuple

from langchain.schema import Document
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ---------------------------------------------------------------------------
# Type aliases
# ---------------------------------------------------------------------------
AcademicLevel = Literal[
    "Middle School",
    "High School (AP / Honors)",
    "College / Undergraduate",
    "Self-Paced Professional",
]
LessonDuration = Literal[
    "10 - 15 mins",
    "20 - 25 mins",
    "40 - 50 mins",
]
Language = Literal["English", "Hindi", "Hinglish"]

# ---------------------------------------------------------------------------
# Retrieval hyper-parameters
# ---------------------------------------------------------------------------
_RRF_K: int = 60                   # RRF constant (standard = 60)
_DENSE_CANDIDATES: int = 15        # raw dense recall
_SPARSE_CANDIDATES: int = 15       # raw BM25 recall
_RRF_TOP: int = 15                 # post-fusion pool size passed to re-ranker

# Duration → top-k final parent context mapping
_DURATION_TOPK: Dict[str, int] = {
    "10 - 15 mins": 3,
    "20 - 25 mins": 5,
    "40 - 50 mins": 8,
}

# Academic level → chunk_type bias weights (applied as additive score boost)
_LEVEL_BIAS: Dict[str, Dict[str, float]] = {
    "Middle School": {
        "analogy": 0.25,
        "example": 0.20,
        "concept": 0.10,
        "definition": 0.05,
        "formula/code": -0.10,
    },
    "High School (AP / Honors)": {
        "concept": 0.15,
        "definition": 0.15,
        "example": 0.10,
        "analogy": 0.05,
        "formula/code": 0.10,
    },
    "College / Undergraduate": {
        "formula/code": 0.20,
        "definition": 0.15,
        "concept": 0.15,
        "example": 0.05,
        "analogy": 0.00,
    },
    "Self-Paced Professional": {
        "formula/code": 0.25,
        "concept": 0.15,
        "definition": 0.10,
        "example": 0.10,
        "analogy": 0.00,
    },
}

# Pedagogical highlight → preferred chunk_types
_HIGHLIGHT_CHUNK_TYPES: Dict[str, List[str]] = {
    "Real-World Analogies": ["analogy", "example"],
    "Visual Diagramming": ["concept", "formula/code"],
    "Core Concepts": ["concept", "definition"],
    "Step-by-Step Derivations": ["formula/code", "concept"],
    "Mnemonics & Memory Tricks": ["analogy", "example"],
    "Practice Problems": ["formula/code", "example"],
}


# ---------------------------------------------------------------------------
# Pydantic UI Contract
# ---------------------------------------------------------------------------

class LessonRetrievalRequest(BaseModel):
    """
    Frontend UI payload for a lesson retrieval request.

    All fields map directly to the UI form contract specified in the
    NeuraSetu pedagogical engine interface.
    """

    topic_title: str = Field(
        ...,
        description="Primary topic the lesson covers (e.g. 'Cellular Respiration & ATP Synthesis').",
        min_length=2,
    )
    subject_name: str = Field(
        ...,
        description="Subject label from the UI (e.g. 'AP Biology').",
        min_length=2,
    )
    learning_objectives: List[str] = Field(
        ...,
        description="Ordered list of specific learning outcomes the student should achieve.",
        min_length=1,
    )
    subject_domain: str = Field(
        ...,
        description="Broad domain (e.g. 'Biology & Life Sciences').",
    )
    target_academic_level: AcademicLevel = Field(
        ...,
        description="Academic level selector from the UI.",
    )
    lesson_duration: LessonDuration = Field(
        ...,
        description="Lesson length slot selected in the UI.",
    )
    pedagogical_highlights: List[str] = Field(
        default_factory=list,
        description="Ordered list of pedagogical strategies requested (e.g. 'Real-World Analogies').",
    )
    language: Language = Field(
        default="English",
        description="Preferred response language for the pedagogical engine.",
    )

    @field_validator("learning_objectives")
    @classmethod
    def objectives_not_empty(cls, v: List[str]) -> List[str]:
        cleaned = [o.strip() for o in v if o.strip()]
        if not cleaned:
            raise ValueError("learning_objectives must contain at least one non-empty string.")
        return cleaned


# ---------------------------------------------------------------------------
# Reciprocal Rank Fusion
# ---------------------------------------------------------------------------

def _reciprocal_rank_fusion(
    ranked_lists: List[List[Document]],
    k: int = _RRF_K,
    top_n: int = _RRF_TOP,
) -> List[Document]:
    """
    Merge multiple ranked document lists using Reciprocal Rank Fusion (RRF).

    RRF Score for document d across lists:
        score(d) = Σ  1 / (k + rank_i(d))

    where rank_i(d) is the 1-based rank of d in list i (or not present = skip).

    Parameters
    ----------
    ranked_lists:
        Each inner list is a ranked list of Documents (best first).
    k:
        RRF constant, typically 60.
    top_n:
        Number of documents to return after fusion.

    Returns
    -------
    List[Document]
        Fused top-n Documents, sorted by RRF score descending, each annotated
        with ``metadata["rrf_score"]``.
    """
    scores: Dict[str, float] = defaultdict(float)
    doc_registry: Dict[str, Document] = {}

    for ranked in ranked_lists:
        for rank, doc in enumerate(ranked, start=1):
            # Use child_id as the deduplication key; fall back to page_content hash
            key = doc.metadata.get("child_id") or str(hash(doc.page_content))
            scores[key] += 1.0 / (k + rank)
            if key not in doc_registry:
                doc_registry[key] = doc

    sorted_keys = sorted(scores, key=lambda x: scores[x], reverse=True)[:top_n]
    results = []
    for key in sorted_keys:
        doc = doc_registry[key]
        doc.metadata["rrf_score"] = round(scores[key], 6)
        results.append(doc)

    logger.debug("RRF: merged %d lists → %d candidates.", len(ranked_lists), len(results))
    return results


# ---------------------------------------------------------------------------
# Pedagogical Metadata Scoring
# ---------------------------------------------------------------------------

def _apply_pedagogical_bias(
    candidates: List[Document],
    request: LessonRetrievalRequest,
) -> List[Document]:
    """
    Boost or penalise RRF scores based on academic level and pedagogical highlights.

    Scoring formula applied to each candidate::

        final_score = rrf_score
                      + level_bias.get(chunk_type, 0)
                      + highlight_bonus (if chunk_type in preferred set)

    Documents are returned re-sorted by ``final_score`` (descending).

    Parameters
    ----------
    candidates:
        RRF-fused candidate Documents (must have ``rrf_score`` in metadata).
    request:
        The full ``LessonRetrievalRequest`` carrying academic level and
        pedagogical highlights.

    Returns
    -------
    List[Document]
        Reordered candidates with ``final_score`` in metadata.
    """
    level_biases = _LEVEL_BIAS.get(request.target_academic_level, {})

    # Collect all preferred chunk_types from the highlights list
    preferred_types: set[str] = set()
    for highlight in request.pedagogical_highlights:
        preferred_types.update(_HIGHLIGHT_CHUNK_TYPES.get(highlight, []))

    for doc in candidates:
        chunk_type: str = doc.metadata.get("chunk_type", "concept")
        rrf_score: float = doc.metadata.get("rrf_score", 0.0)
        level_bonus: float = level_biases.get(chunk_type, 0.0)
        highlight_bonus: float = 0.10 if chunk_type in preferred_types else 0.0
        doc.metadata["final_score"] = round(rrf_score + level_bonus + highlight_bonus, 6)

    candidates.sort(key=lambda d: d.metadata["final_score"], reverse=True)
    return candidates


# ---------------------------------------------------------------------------
# Cross-Encoder Re-ranking (FlashRank)
# ---------------------------------------------------------------------------

def _rerank_with_flashrank(
    query: str,
    candidates: List[Document],
    top_k: int,
) -> List[Document]:
    """
    Re-rank candidate chunks with FlashRank cross-encoder and return top-k.

    FlashRank is a lightweight, CPU-friendly cross-encoder that outperforms
    bi-encoder ranking for short candidate pools.

    Falls back to the existing ``final_score`` ordering if FlashRank is not
    installed or fails (graceful degradation).

    Parameters
    ----------
    query:
        The user or transformed query string.
    candidates:
        Pool of candidate Documents to re-rank (typically 15).
    top_k:
        Number of documents to return.

    Returns
    -------
    List[Document]
        Top-k re-ranked Documents with ``rerank_score`` in metadata.
    """
    try:
        from flashrank import Ranker, RerankRequest  # type: ignore
    except ImportError:
        logger.warning(
            "FlashRank not installed — falling back to pedagogical score ordering. "
            "Install with: pip install flashrank"
        )
        return candidates[:top_k]

    try:
        ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="/tmp/flashrank")
        passages = [
            {"id": i, "text": doc.page_content}
            for i, doc in enumerate(candidates)
        ]
        rerank_request = RerankRequest(query=query, passages=passages)
        results = ranker.rerank(rerank_request)

        reranked: List[Document] = []
        for result in results[:top_k]:
            doc = candidates[result["id"]]
            doc.metadata["rerank_score"] = round(float(result["score"]), 6)
            reranked.append(doc)

        logger.info("FlashRank: re-ranked %d → top %d.", len(candidates), top_k)
        return reranked

    except Exception as exc:
        logger.error("FlashRank re-ranking failed: %s — falling back to score order.", exc)
        return candidates[:top_k]


# ---------------------------------------------------------------------------
# Agentic Query Transformation
# ---------------------------------------------------------------------------

def rewrite_misconception_query(
    student_response: str,
    context_topic: str,
    llm_client=None,
) -> str:
    """
    Rewrite a student's incorrect answer into a corrective retrieval query.

    When a student provides a wrong answer, this function steers the query
    *away* from the flawed premise and *toward* the underlying first principle
    or counter-analogy that would resolve the misconception.

    Strategy
    --------
    1. If an LLM client is supplied, use a structured prompt to generate the
       rewritten query (preferred — higher quality).
    2. If no LLM client is provided, apply a template-based heuristic fallback
       that wraps the topic in a "first principles" framing.

    Parameters
    ----------
    student_response:
        The student's incorrect or partially-correct answer verbatim.
    context_topic:
        The topic being taught (e.g. "Cellular Respiration").
    llm_client:
        An optional LLM client. Accepted types:

        * A LangChain chat model (must expose an ``invoke`` method), e.g.
          ``langchain_community.llms.HuggingFaceHub(...)``.
        * A ``huggingface_hub.InferenceClient`` instance (free HuggingFace
          Inference API — no billing required for public models).

        Pass ``None`` to use the heuristic fallback (no network calls).

    Returns
    -------
    str
        A rewritten query designed to retrieve corrective context.

    Examples
    --------
    Input:
        student_response = "ATP is made only in the mitochondria"
        context_topic    = "Cellular Respiration"

    Output (LLM mode):
        "What are all the cellular locations and processes that produce ATP,
         correcting the misconception that it is made exclusively in the
         mitochondria?"

    Output (fallback):
        "Explain the first principle underlying Cellular Respiration that
         corrects the misconception: 'ATP is made only in the mitochondria'.
         Provide a counter-analogy."
    """
    if llm_client is None:
        # --- Heuristic fallback ---
        rewritten = (
            f"Explain the first principle underlying {context_topic} that "
            f"corrects the misconception: '{student_response.strip()}'. "
            f"Provide a counter-analogy and the scientifically accurate explanation."
        )
        logger.info("rewrite_misconception_query: using heuristic fallback.")
        return rewritten

    # --- LLM-powered rewrite ---
    system_prompt = (
        "You are a Socratic AI tutor. A student has given an incorrect answer. "
        "Your job is to rewrite their response as a precise retrieval query that: "
        "(1) ignores the student's flawed premise, "
        "(2) targets the correct first principle or foundational concept, "
        "(3) requests a counter-analogy to the misconception. "
        "Return ONLY the rewritten query string — no explanation, no preamble."
    )
    user_prompt = (
        f"Topic: {context_topic}\n"
        f"Student's incorrect response: {student_response}\n\n"
        "Rewritten retrieval query:"
    )

    try:
        # Branch 1: LangChain chat model (invoke interface)
        if hasattr(llm_client, "invoke"):
            from langchain.schema import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
            response = llm_client.invoke(messages)
            rewritten = response.content.strip()
        else:
            # Branch 2: HuggingFace InferenceClient (free tier)
            # Uses mistralai/Mistral-7B-Instruct-v0.3 — a public model,
            # no billing required. Set HF_TOKEN env var for higher rate limits.
            full_prompt = f"[INST] {system_prompt}\n\n{user_prompt} [/INST]"
            raw = llm_client.text_generation(
                full_prompt,
                max_new_tokens=120,
                temperature=0.3,
                model="mistralai/Mistral-7B-Instruct-v0.3",
            )
            rewritten = raw.strip()

        logger.info("rewrite_misconception_query: LLM rewrite successful.")
        return rewritten

    except Exception as exc:
        logger.error("LLM rewrite failed (%s) — falling back to heuristic.", exc)
        return (
            f"Explain the first principle underlying {context_topic} that "
            f"corrects the misconception: '{student_response.strip()}'."
        )


def decompose_learning_objectives(
    objectives_list: List[str],
    topic_title: str,
    llm_client=None,
) -> List[str]:
    """
    Convert a list of high-level learning objectives into targeted sub-queries.

    Each sub-query is designed to retrieve the specific supporting context
    (definitions, examples, formulas, analogies) required to teach that
    checkpoint within the lesson.

    Parameters
    ----------
    objectives_list:
        A list of learning objective strings from the UI payload.
    topic_title:
        The overarching lesson topic — used to ground each decomposition.
    llm_client:
        Optional LLM client — same accepted types as ``rewrite_misconception_query``
        (LangChain chat model or ``huggingface_hub.InferenceClient``).
        If ``None``, a deterministic rule-based decomposition is returned.

    Returns
    -------
    List[str]
        One or more sub-queries per objective. Length >= len(objectives_list).

    Examples
    --------
    Input objective:
        "Explain how ATP is synthesised during the Krebs cycle"

    Output sub-queries (LLM mode):
        [
          "What are the inputs and outputs of the Krebs cycle?",
          "How is ATP generated from acetyl-CoA in the Krebs cycle?",
          "What enzymes catalyse ATP synthesis in the Krebs cycle?",
        ]

    Output sub-queries (fallback):
        [
          "Definition and overview of: Explain how ATP is synthesised during the Krebs cycle",
          "Key concepts and mechanisms in: Explain how ATP is synthesised during the Krebs cycle",
          "Examples and analogies for: Explain how ATP is synthesised during the Krebs cycle",
        ]
    """
    if not objectives_list:
        logger.warning("decompose_learning_objectives: empty objectives_list.")
        return []

    if llm_client is None:
        # --- Rule-based fallback: three fixed sub-query templates per objective ---
        sub_queries: List[str] = []
        for obj in objectives_list:
            sub_queries.extend([
                f"Definition and foundational overview of: {obj} (within {topic_title})",
                f"Key mechanisms, concepts, and processes in: {obj}",
                f"Real-world examples, analogies, or formulas illustrating: {obj}",
            ])
        logger.info(
            "decompose_learning_objectives: heuristic — %d objectives → %d sub-queries.",
            len(objectives_list),
            len(sub_queries),
        )
        return sub_queries

    # --- LLM-powered decomposition ---
    system_prompt = (
        "You are an expert curriculum designer and pedagogical AI. "
        "Given a learning objective within a lesson topic, produce 2-4 concise, "
        "specific retrieval sub-queries that together would surface all the "
        "supporting knowledge a teacher needs to address that objective. "
        "Return ONLY a JSON array of strings — no explanation."
    )
    all_sub_queries: List[str] = []

    for obj in objectives_list:
        user_prompt = (
            f"Lesson Topic: {topic_title}\n"
            f"Learning Objective: {obj}\n\n"
            "Retrieval sub-queries (JSON array):"
        )
        try:
            import json as _json

            if hasattr(llm_client, "invoke"):
                # LangChain chat model path
                from langchain.schema import HumanMessage, SystemMessage
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ]
                response = llm_client.invoke(messages)
                raw = response.content.strip()
            else:
                # HuggingFace InferenceClient path (free tier)
                full_prompt = (
                    f"[INST] {system_prompt}\n\n{user_prompt} [/INST]"
                )
                raw = llm_client.text_generation(
                    full_prompt,
                    max_new_tokens=200,
                    temperature=0.2,
                    model="mistralai/Mistral-7B-Instruct-v0.3",
                )

            # Extract the first JSON array found in the response
            import re as _re
            array_match = _re.search(r"\[.*?\]", raw, _re.DOTALL)
            if array_match:
                sub_qs = _json.loads(array_match.group())
                all_sub_queries.extend([str(q) for q in sub_qs])
            else:
                raise ValueError("No JSON array found in LLM response.")

        except Exception as exc:
            logger.error(
                "LLM decomposition failed for objective '%s' (%s) — using fallback.", obj, exc
            )
            all_sub_queries.extend([
                f"Definition and foundational overview of: {obj}",
                f"Key mechanisms and concepts in: {obj}",
                f"Examples and analogies for: {obj}",
            ])

    logger.info(
        "decompose_learning_objectives: %d objectives → %d sub-queries.",
        len(objectives_list),
        len(all_sub_queries),
    )
    return all_sub_queries


# ---------------------------------------------------------------------------
# Core Retrieval Pipeline
# ---------------------------------------------------------------------------

def retrieve_lesson_context(
    request: LessonRetrievalRequest,
    vectorstore,
    bm25,
    child_chunks: List[Document],
    store_dir: str = "./doc_store",
    llm_client=None,
) -> Dict[str, Any]:
    """
    Full advanced hybrid retrieval pipeline for a lesson request.

    Pipeline
    --------
    1. Decompose learning objectives into sub-queries.
    2. For each sub-query, run dense (ChromaDB) + sparse (BM25) retrieval.
    3. Merge all candidate lists via Reciprocal Rank Fusion (RRF).
    4. Apply pedagogical metadata bias (academic level + pedagogical highlights).
    5. Re-rank with FlashRank cross-encoder.
    6. Resolve child chunk parent_ids → full parent context from LocalFileStore.
    7. Return structured context dict ready for the pedagogical engine.

    Parameters
    ----------
    request:
        A validated ``LessonRetrievalRequest`` from the frontend.
    vectorstore:
        Loaded Chroma vectorstore (from ``embedding.load_chroma_vectorstore``).
    bm25:
        Fitted BM25Okapi index (from ``embedding.load_bm25_index``).
    child_chunks:
        The BM25 corpus (must match the index order).
    store_dir:
        Path to the LocalFileStore directory for parent document lookup.
    llm_client:
        Optional LLM client for agentic query decomposition.

    Returns
    -------
    Dict[str, Any]
        {
          "topic": str,
          "language": str,
          "target_academic_level": str,
          "lesson_duration": str,
          "pedagogical_highlights": List[str],
          "sub_queries": List[str],
          "child_candidates": List[Document],  -- top-k re-ranked children
          "parent_contexts": List[Document],   -- resolved parent docs
          "metadata": Dict[str, Any],          -- retrieval stats
        }
    """
    from rag.embedding import bm25_search  # local import to avoid circular dep

    # ------------------------------------------------------------------ #
    # 1. Build master query + decompose objectives into sub-queries
    # ------------------------------------------------------------------ #
    master_query = (
        f"{request.topic_title}. "
        f"Subject: {request.subject_name}. "
        f"Domain: {request.subject_domain}."
    )

    sub_queries: List[str] = decompose_learning_objectives(
        objectives_list=request.learning_objectives,
        topic_title=request.topic_title,
        llm_client=llm_client,
    )
    all_queries = [master_query] + sub_queries

    # ------------------------------------------------------------------ #
    # 2. Dense + Sparse retrieval for each query
    # ------------------------------------------------------------------ #
    all_ranked_lists: List[List[Document]] = []

    for query in all_queries:
        # Dense retrieval (ChromaDB MMR / similarity)
        try:
            dense_results: List[Document] = vectorstore.similarity_search(
                query, k=_DENSE_CANDIDATES
            )
            all_ranked_lists.append(dense_results)
        except Exception as exc:
            logger.warning("Dense retrieval failed for query '%s': %s", query[:60], exc)

        # Sparse retrieval (BM25)
        try:
            sparse_results: List[Document] = bm25_search(
                bm25, child_chunks, query, top_k=_SPARSE_CANDIDATES
            )
            all_ranked_lists.append(sparse_results)
        except Exception as exc:
            logger.warning("Sparse retrieval failed for query '%s': %s", query[:60], exc)

    if not all_ranked_lists:
        logger.error("All retrieval attempts failed — returning empty context.")
        return _empty_context(request)

    # ------------------------------------------------------------------ #
    # 3. Reciprocal Rank Fusion
    # ------------------------------------------------------------------ #
    fused_candidates: List[Document] = _reciprocal_rank_fusion(
        ranked_lists=all_ranked_lists,
        k=_RRF_K,
        top_n=_RRF_TOP,
    )

    # ------------------------------------------------------------------ #
    # 4. Pedagogical metadata bias
    # ------------------------------------------------------------------ #
    biased_candidates: List[Document] = _apply_pedagogical_bias(fused_candidates, request)

    # ------------------------------------------------------------------ #
    # 5. Cross-Encoder Re-ranking
    # ------------------------------------------------------------------ #
    top_k: int = _DURATION_TOPK.get(request.lesson_duration, 5)
    reranked_children: List[Document] = _rerank_with_flashrank(
        query=master_query,
        candidates=biased_candidates,
        top_k=top_k,
    )

    # ------------------------------------------------------------------ #
    # 6. Resolve parent contexts from LocalFileStore
    # ------------------------------------------------------------------ #
    seen_parent_ids: List[str] = []
    ordered_parent_ids: List[str] = []
    for doc in reranked_children:
        pid = doc.metadata.get("parent_id", "")
        if pid and pid not in seen_parent_ids:
            seen_parent_ids.append(pid)
            ordered_parent_ids.append(pid)

    from rag.ingestion import fetch_parents_batch  # local import
    parent_contexts: List[Document] = fetch_parents_batch(
        parent_ids=ordered_parent_ids,
        store_dir=store_dir,
    )

    logger.info(
        "Retrieval complete: %d sub-queries, %d fused candidates, "
        "%d re-ranked children, %d parent contexts resolved.",
        len(sub_queries),
        len(fused_candidates),
        len(reranked_children),
        len(parent_contexts),
    )

    return {
        "topic": request.topic_title,
        "language": request.language,
        "target_academic_level": request.target_academic_level,
        "lesson_duration": request.lesson_duration,
        "pedagogical_highlights": request.pedagogical_highlights,
        "sub_queries": sub_queries,
        "child_candidates": reranked_children,
        "parent_contexts": parent_contexts,
        "metadata": {
            "total_sub_queries": len(sub_queries),
            "total_ranked_lists_fused": len(all_ranked_lists),
            "rrf_pool_size": len(fused_candidates),
            "final_top_k": top_k,
            "parents_resolved": len(parent_contexts),
        },
    }


def retrieve_misconception_context(
    student_response: str,
    context_topic: str,
    request: LessonRetrievalRequest,
    vectorstore,
    bm25,
    child_chunks: List[Document],
    store_dir: str = "./doc_store",
    llm_client=None,
) -> Dict[str, Any]:
    """
    Specialised retrieval triggered when a student answers incorrectly.

    Rewrites the student's flawed premise into a corrective query using
    ``rewrite_misconception_query``, then runs the full hybrid retrieval
    pipeline to surface corrective first-principle context.

    Parameters
    ----------
    student_response:
        The student's verbatim incorrect answer.
    context_topic:
        The topic being evaluated (e.g. "Cellular Respiration").
    request:
        The active ``LessonRetrievalRequest`` (for level/duration calibration).
    vectorstore, bm25, child_chunks, store_dir, llm_client:
        Same as ``retrieve_lesson_context``.

    Returns
    -------
    Dict[str, Any]
        Same structure as ``retrieve_lesson_context`` with an additional
        ``"rewritten_query"`` key.
    """
    corrective_query = rewrite_misconception_query(
        student_response=student_response,
        context_topic=context_topic,
        llm_client=llm_client,
    )
    logger.info("Misconception rewrite → '%s'", corrective_query[:120])

    # Temporarily inject the corrective query as the sole learning objective
    import copy
    corrective_request = copy.deepcopy(request)
    corrective_request.topic_title = context_topic
    # We will pass the corrective query directly through sub-query decomp bypass
    corrective_request.learning_objectives = [corrective_query]

    context = retrieve_lesson_context(
        request=corrective_request,
        vectorstore=vectorstore,
        bm25=bm25,
        child_chunks=child_chunks,
        store_dir=store_dir,
        llm_client=llm_client,
    )
    context["rewritten_query"] = corrective_query
    context["original_student_response"] = student_response
    return context


# ---------------------------------------------------------------------------
# Internal utilities
# ---------------------------------------------------------------------------

def _empty_context(request: LessonRetrievalRequest) -> Dict[str, Any]:
    """Return a safe empty context shell when retrieval produces no results."""
    return {
        "topic": request.topic_title,
        "language": request.language,
        "target_academic_level": request.target_academic_level,
        "lesson_duration": request.lesson_duration,
        "pedagogical_highlights": request.pedagogical_highlights,
        "sub_queries": [],
        "child_candidates": [],
        "parent_contexts": [],
        "metadata": {
            "total_sub_queries": 0,
            "total_ranked_lists_fused": 0,
            "rrf_pool_size": 0,
            "final_top_k": 0,
            "parents_resolved": 0,
        },
    }