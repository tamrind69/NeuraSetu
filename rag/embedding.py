"""
embedding.py — NeuraSetu AI Teacher
=====================================
Multilingual Vector Store & Dense/Sparse Indexing.

Responsibilities
----------------
- Initialise a multilingual embedding model (``BAAI/bge-m3`` via HuggingFace
  sentence-transformers) to support cross-lingual queries (English, Hindi,
  Hinglish, and 100+ other languages).
- Vector DB: ChromaDB collection for child chunk embeddings with persistent storage.
- Sparse Indexing: BM25 alongside dense vectors for hybrid keyword/semantic search.

Cross-lingual Support
---------------------
bge-m3 supports 100+ languages natively — students can query English textbooks
in Hindi or Hinglish with zero extra configuration.

Dependencies (pip)
------------------
    langchain langchain-community chromadb
    rank-bm25 sentence-transformers huggingface-hub
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List, Literal, Optional

from langchain.schema import Document

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ---------------------------------------------------------------------------
# Embedding backend — HuggingFace bge-m3 (free tier, fully local)
# ---------------------------------------------------------------------------
EmbeddingBackend = Literal["bge-m3"]   # only supported backend

_DEFAULT_BACKEND: EmbeddingBackend = "bge-m3"
_BGE_MODEL = "BAAI/bge-m3"

# Optional: set HF_TOKEN env var if you need access to gated models.
# For bge-m3 (public model) no token is required.

# ChromaDB
_DEFAULT_CHROMA_DIR: str = "./chroma_db"
_DEFAULT_COLLECTION_NAME: str = "neurasetu_children"

# BM25
_DEFAULT_BM25_PATH: str = "./bm25_index.pkl"


# ---------------------------------------------------------------------------
# Internal lazy import — HuggingFace sentence-transformers
# ---------------------------------------------------------------------------

def _get_bge_embeddings():
    """
    Return a LangChain HuggingFaceEmbeddings instance backed by BAAI/bge-m3.

    bge-m3 is a free, public HuggingFace model that supports 100+ languages.
    No API key is required; the model weights are downloaded on first use
    (~570 MB) and cached locally in ``~/.cache/huggingface``.

    To speed up inference on GPU, change ``device`` to ``"cuda"``.
    For the HuggingFace Inference API (serverless, no local GPU needed),
    set the ``HF_TOKEN`` environment variable and use
    ``HuggingFaceInferenceAPIEmbeddings`` instead.
    """
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
    except ImportError as exc:
        raise ImportError(
            "Install 'sentence-transformers' and 'langchain-community' for bge-m3 embeddings: "
            "pip install sentence-transformers langchain-community"
        ) from exc
    return HuggingFaceEmbeddings(
        model_name=_BGE_MODEL,
        model_kwargs={"device": "cpu"},   # set to "cuda" if a GPU is available
        encode_kwargs={"normalize_embeddings": True},
    )


def get_embedding_model(backend: EmbeddingBackend = _DEFAULT_BACKEND):
    """
    Return an initialised LangChain embedding model.

    Parameters
    ----------
    backend:
        Currently only ``"bge-m3"`` is supported (HuggingFace free tier).
        The model is downloaded on first use and cached locally.

    Returns
    -------
    HuggingFaceEmbeddings
        A LangChain-compatible embedding model ready for use with ChromaDB.
    """
    if backend == "bge-m3":
        model = _get_bge_embeddings()
        logger.info("Embedding backend: HuggingFace %s (free tier, local)", _BGE_MODEL)
        return model
    raise ValueError(
        f"Unknown embedding backend '{backend}'. Only 'bge-m3' is supported."
    )


# ---------------------------------------------------------------------------
# ChromaDB — Dense Vector Store
# ---------------------------------------------------------------------------

def build_chroma_vectorstore(
    child_chunks: List[Document],
    embedding_model,
    persist_directory: str = _DEFAULT_CHROMA_DIR,
    collection_name: str = _DEFAULT_COLLECTION_NAME,
):
    """
    Build (or update) a persistent ChromaDB collection from child chunks.

    Each chunk's full metadata dict is stored alongside the embedding so that
    downstream retrieval can filter by ``chunk_type``, ``subject_name``, etc.

    Parameters
    ----------
    child_chunks:
        Child Documents produced by ``ingestion.ingest_document``.
    embedding_model:
        A LangChain-compatible embedding model (from ``get_embedding_model``).
    persist_directory:
        Local directory for ChromaDB's on-disk storage.
    collection_name:
        Name of the ChromaDB collection.

    Returns
    -------
    vectorstore : ``langchain_community.vectorstores.Chroma``
        The live vectorstore instance, ready for similarity search.

    Raises
    ------
    ValueError
        If ``child_chunks`` is empty.
    """
    if not child_chunks:
        raise ValueError("child_chunks is empty — nothing to index.")

    try:
        from langchain_community.vectorstores import Chroma
    except ImportError as exc:
        raise ImportError("Install 'chromadb' and 'langchain-community'.") from exc

    Path(persist_directory).mkdir(parents=True, exist_ok=True)

    # ChromaDB metadata values must be str | int | float | bool — coerce safely
    sanitised_chunks = _sanitise_metadata(child_chunks)

    vectorstore = Chroma.from_documents(
        documents=sanitised_chunks,
        embedding=embedding_model,
        persist_directory=persist_directory,
        collection_name=collection_name,
    )
    logger.info(
        "ChromaDB: indexed %d child chunks in collection '%s' at '%s'.",
        len(child_chunks),
        collection_name,
        persist_directory,
    )
    return vectorstore


def load_chroma_vectorstore(
    embedding_model,
    persist_directory: str = _DEFAULT_CHROMA_DIR,
    collection_name: str = _DEFAULT_COLLECTION_NAME,
):
    """
    Load an existing ChromaDB vectorstore from disk.

    Parameters
    ----------
    embedding_model:
        Must be the same model used during ``build_chroma_vectorstore``.
    persist_directory:
        Directory where ChromaDB was persisted.
    collection_name:
        Name of the ChromaDB collection.

    Returns
    -------
    vectorstore : ``langchain_community.vectorstores.Chroma``
    """
    try:
        from langchain_community.vectorstores import Chroma
    except ImportError as exc:
        raise ImportError("Install 'chromadb' and 'langchain-community'.") from exc

    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_model,
        collection_name=collection_name,
    )
    logger.info(
        "ChromaDB: loaded collection '%s' from '%s'.",
        collection_name,
        persist_directory,
    )
    return vectorstore


def add_to_chroma_vectorstore(
    vectorstore,
    new_child_chunks: List[Document],
) -> None:
    """
    Incrementally add new child chunks to an existing ChromaDB collection.

    Parameters
    ----------
    vectorstore:
        An active Chroma vectorstore instance.
    new_child_chunks:
        New child Documents to add (must share the same schema).
    """
    if not new_child_chunks:
        logger.warning("add_to_chroma_vectorstore: no new chunks to add, skipping.")
        return
    sanitised = _sanitise_metadata(new_child_chunks)
    vectorstore.add_documents(sanitised)
    logger.info("ChromaDB: added %d new child chunk(s).", len(new_child_chunks))


# ---------------------------------------------------------------------------
# BM25 — Sparse Keyword Index
# ---------------------------------------------------------------------------

def build_bm25_index(
    child_chunks: List[Document],
    bm25_path: str = _DEFAULT_BM25_PATH,
):
    """
    Build a BM25 sparse index from child chunk texts and persist it to disk.

    BM25 is crucial for exact-match retrieval of scientific terms, formulae,
    gene names, chemical symbols, and other high-specificity tokens that dense
    embeddings may dilute.

    Parameters
    ----------
    child_chunks:
        Child Documents whose ``page_content`` will be tokenised.
    bm25_path:
        File path for pickling the ``BM25Okapi`` index alongside its corpus.

    Returns
    -------
    bm25 : ``rank_bm25.BM25Okapi``
        The fitted BM25 index.
    tokenised_corpus : List[List[str]]
        The tokenised corpus (needed to map BM25 scores back to documents).

    Raises
    ------
    ValueError
        If ``child_chunks`` is empty.
    ImportError
        If ``rank-bm25`` is not installed.
    """
    if not child_chunks:
        raise ValueError("child_chunks is empty — nothing to index.")

    try:
        from rank_bm25 import BM25Okapi
    except ImportError as exc:
        raise ImportError("Install 'rank-bm25' for sparse indexing.") from exc

    import pickle

    tokenised_corpus = [_tokenise(doc.page_content) for doc in child_chunks]
    bm25 = BM25Okapi(tokenised_corpus)

    bm25_path_obj = Path(bm25_path)
    bm25_path_obj.parent.mkdir(parents=True, exist_ok=True)
    with open(bm25_path_obj, "wb") as f:
        pickle.dump({"bm25": bm25, "corpus": tokenised_corpus, "chunks": child_chunks}, f)

    logger.info("BM25: indexed %d child chunks → '%s'.", len(child_chunks), bm25_path)
    return bm25, tokenised_corpus


def load_bm25_index(bm25_path: str = _DEFAULT_BM25_PATH):
    """
    Load a previously built BM25 index from disk.

    Returns
    -------
    bm25 : ``BM25Okapi``
    child_chunks : List[Document]
        The corpus documents in the same order as the BM25 index.

    Raises
    ------
    FileNotFoundError
        If the pickle file does not exist.
    """
    import pickle

    bm25_path_obj = Path(bm25_path)
    if not bm25_path_obj.exists():
        raise FileNotFoundError(
            f"BM25 index not found at '{bm25_path}'. "
            "Call build_bm25_index first."
        )
    with open(bm25_path_obj, "rb") as f:
        data = pickle.load(f)

    logger.info("BM25: loaded index from '%s'.", bm25_path)
    return data["bm25"], data["chunks"]


def bm25_search(
    bm25,
    child_chunks: List[Document],
    query: str,
    top_k: int = 15,
) -> List[Document]:
    """
    Score all child chunks against ``query`` using BM25 and return top-k docs.

    Parameters
    ----------
    bm25:
        A fitted ``BM25Okapi`` instance.
    child_chunks:
        The corpus Documents aligned with the BM25 index (same order).
    query:
        The raw query string (will be tokenised internally).
    top_k:
        Number of top results to return.

    Returns
    -------
    List[Document]
        Top-k Documents ranked by BM25 score (descending).
    """
    import numpy as np

    tokenised_query = _tokenise(query)
    scores = bm25.get_scores(tokenised_query)
    top_indices = np.argsort(scores)[::-1][:top_k]
    results = []
    for idx in top_indices:
        doc = child_chunks[int(idx)]
        doc.metadata["bm25_score"] = float(scores[int(idx)])
        results.append(doc)
    return results


# ---------------------------------------------------------------------------
# Internal utilities
# ---------------------------------------------------------------------------

def _tokenise(text: str) -> List[str]:
    """
    Simple whitespace + punctuation tokeniser for BM25.

    Lowercases, strips punctuation (except hyphens inside words), and splits on
    whitespace. Intentionally lightweight to avoid NLTK dependency.
    """
    import re as _re
    text = text.lower()
    text = _re.sub(r"[^\w\s\-]", " ", text)
    return text.split()


def _sanitise_metadata(chunks: List[Document]) -> List[Document]:
    """
    Ensure all metadata values are ChromaDB-compatible types.

    ChromaDB only accepts ``str | int | float | bool`` as metadata values.
    Anything else is coerced to str.
    """
    _allowed = (str, int, float, bool)
    sanitised: List[Document] = []
    for doc in chunks:
        clean_meta = {
            k: v if isinstance(v, _allowed) else str(v)
            for k, v in doc.metadata.items()
        }
        sanitised.append(Document(page_content=doc.page_content, metadata=clean_meta))
    return sanitised