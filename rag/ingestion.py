"""
ingestion.py — NeuraSetu AI Teacher
====================================
Hierarchical (Parent-Document) Chunking Pipeline.

Responsibilities
----------------
- Parse PDF, DOCX, PPTX, and TXT source documents.
- Split text into *child* chunks (300–400 tokens) for high-precision vector
  search and *parent* chunks (1500–2000 tokens) to preserve full pedagogical
  context.
- Enrich every chunk with structured metadata:
    doc_id, chapter_or_section, chunk_type
    ('definition' | 'concept' | 'analogy' | 'example' | 'formula/code')
- Persist parent documents to a LocalFileStore so they can be fetched at
  retrieval time without reloading the entire source file.

Dependencies (pip)
------------------
    langchain langchain-community langchain-text-splitters
    pypdf python-docx python-pptx sentence-transformers
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

# ---------------------------------------------------------------------------
# LangChain document loaders
# ---------------------------------------------------------------------------
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    UnstructuredPowerPointLoader,
    TextLoader,
)
from langchain.storage import LocalFileStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
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
# Constants
# ---------------------------------------------------------------------------
CHILD_CHUNK_TOKENS: int = 350       # target size for child chunks
PARENT_CHUNK_TOKENS: int = 1750     # target size for parent chunks
TOKENS_PER_CHAR_ESTIMATE: float = 0.25  # heuristic: 1 token ≈ 4 chars

# Regex patterns used for lightweight chunk-type classification
_CHUNK_TYPE_PATTERNS: Dict[str, re.Pattern[str]] = {
    "formula/code": re.compile(
        r"(\$.*?\$|```[\s\S]*?```|\\frac|\\sum|\\int|def |class |import |\bO\()",
        re.MULTILINE,
    ),
    "definition": re.compile(
        r"\b(is defined as|refers to|definition|means that|is the process of)\b",
        re.IGNORECASE,
    ),
    "analogy": re.compile(
        r"\b(just like|similar to|think of .* as|analogous to|like a|imagine)\b",
        re.IGNORECASE,
    ),
    "example": re.compile(
        r"\b(for example|e\.g\.|for instance|such as|consider the case)\b",
        re.IGNORECASE,
    ),
}

ChunkType = Literal["definition", "concept", "analogy", "example", "formula/code"]

# ---------------------------------------------------------------------------
# Supported file extensions → loader factory
# ---------------------------------------------------------------------------
_SUPPORTED_EXTENSIONS: Dict[str, Any] = {
    ".pdf": PyPDFLoader,
    ".docx": Docx2txtLoader,
    ".pptx": UnstructuredPowerPointLoader,
    ".txt": TextLoader,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stable_doc_id(file_path: Path) -> str:
    """Return a stable SHA-256-based doc_id derived from the file's absolute path."""
    return hashlib.sha256(str(file_path.resolve()).encode()).hexdigest()[:16]


def _estimate_tokens(text: str) -> int:
    """Fast character-based token estimate using 4-chars-per-token heuristic."""
    return max(1, int(len(text) * TOKENS_PER_CHAR_ESTIMATE))


def _classify_chunk_type(text: str) -> ChunkType:
    """
    Rule-based chunk-type classifier.

    Evaluates the text against regex patterns in priority order and returns the
    first matching ChunkType. Falls back to 'concept' when no pattern fires.
    """
    for chunk_type, pattern in _CHUNK_TYPE_PATTERNS.items():
        if pattern.search(text):
            return chunk_type  # type: ignore[return-value]
    return "concept"


def _extract_section_heading(text: str, fallback: str = "Unknown Section") -> str:
    """
    Attempt to extract a Markdown-style or numbered heading from the first line.

    Examples matched::

        '## 3.2 Krebs Cycle'  ->  '3.2 Krebs Cycle'
        '3. Photosynthesis'    ->  '3. Photosynthesis'
    """
    first_line = text.strip().splitlines()[0] if text.strip() else ""
    md_match = re.match(r"^#{1,6}\s+(.+)", first_line)
    if md_match:
        return md_match.group(1).strip()
    num_match = re.match(r"^(\d[\d\.]*\.?\s+.{3,80})", first_line)
    if num_match:
        return num_match.group(1).strip()
    return fallback


def _load_documents(file_path: Path) -> List[Document]:
    """
    Load raw LangChain Documents from a supported file.

    Raises
    ------
    ValueError
        If the file extension is not supported.
    RuntimeError
        If the loader fails to parse the file (e.g. corrupted upload).
    """
    ext = file_path.suffix.lower()
    loader_cls = _SUPPORTED_EXTENSIONS.get(ext)
    if loader_cls is None:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Supported: {list(_SUPPORTED_EXTENSIONS.keys())}"
        )
    try:
        loader = loader_cls(str(file_path))
        docs = loader.load()
        if not docs:
            raise RuntimeError(f"Loader returned no content for '{file_path.name}'.")
        logger.info("Loaded %d page(s) from '%s'.", len(docs), file_path.name)
        return docs
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse '{file_path.name}': {exc}"
        ) from exc


def _build_splitter(
    chunk_tokens: int, overlap_tokens: int = 40
) -> RecursiveCharacterTextSplitter:
    """
    Construct a RecursiveCharacterTextSplitter calibrated to a token budget.

    Uses the 4-chars-per-token heuristic — no external tokeniser required.
    """
    chunk_size_chars = int(chunk_tokens / TOKENS_PER_CHAR_ESTIMATE)
    overlap_chars = int(overlap_tokens / TOKENS_PER_CHAR_ESTIMATE)
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size_chars,
        chunk_overlap=overlap_chars,
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )


# ---------------------------------------------------------------------------
# LocalFileStore persistence helpers
# ---------------------------------------------------------------------------

def _persist_parents_to_store(
    parent_chunks: List[Document],
    store_dir: Path,
) -> None:
    """
    Serialise each parent Document to the LocalFileStore under its parent_id key.

    Each parent is stored as a UTF-8-encoded JSON blob::

        { "page_content": "...", "metadata": {...} }
    """
    store_dir.mkdir(parents=True, exist_ok=True)
    store = LocalFileStore(str(store_dir))
    for doc in parent_chunks:
        key = doc.metadata["parent_id"]
        payload = json.dumps(
            {"page_content": doc.page_content, "metadata": doc.metadata},
            ensure_ascii=False,
        ).encode("utf-8")
        store.mset([(key, payload)])
    logger.debug("Persisted %d parent(s) to '%s'.", len(parent_chunks), store_dir)


def fetch_parent_from_store(
    parent_id: str,
    store_dir: str | Path = "./doc_store",
) -> Optional[Document]:
    """
    Retrieve a single parent Document from the LocalFileStore by its parent_id.

    Parameters
    ----------
    parent_id:
        The parent_id key (format: ``<doc_id>_parent_<index>``).
    store_dir:
        Path to the LocalFileStore directory.

    Returns
    -------
    Document or None
        The reconstructed LangChain Document, or None if the key is not found.
    """
    store = LocalFileStore(str(store_dir))
    results = store.mget([parent_id])
    raw = results[0] if results else None
    if raw is None:
        logger.warning("Parent '%s' not found in store.", parent_id)
        return None
    data = json.loads(raw.decode("utf-8"))
    return Document(page_content=data["page_content"], metadata=data["metadata"])


def fetch_parents_batch(
    parent_ids: List[str],
    store_dir: str | Path = "./doc_store",
) -> List[Document]:
    """
    Batch-fetch multiple parent Documents from the LocalFileStore.

    Missing keys are silently skipped. The returned list preserves order of
    ``parent_ids`` (None values are filtered out).
    """
    store = LocalFileStore(str(store_dir))
    raw_list = store.mget(parent_ids)
    parents: List[Document] = []
    for raw in raw_list:
        if raw is not None:
            data = json.loads(raw.decode("utf-8"))
            parents.append(
                Document(
                    page_content=data["page_content"],
                    metadata=data["metadata"],
                )
            )
    return parents


# ---------------------------------------------------------------------------
# Core public API
# ---------------------------------------------------------------------------

def ingest_document(
    file_path: str | Path,
    store_dir: str | Path = "./doc_store",
    subject_name: Optional[str] = None,
    subject_domain: Optional[str] = None,
) -> Tuple[List[Document], List[Document]]:
    """
    Full ingestion pipeline for a single source document.

    Parameters
    ----------
    file_path:
        Absolute or relative path to the source file.
    store_dir:
        Directory for the LocalFileStore (parent document persistence).
    subject_name:
        E.g. "AP Biology" — stored in chunk metadata.
    subject_domain:
        E.g. "Biology & Life Sciences" — stored in chunk metadata.

    Returns
    -------
    parent_chunks:
        Large context-preserving chunks (1500–2000 tokens).
    child_chunks:
        High-precision searchable chunks (300–400 tokens) with full metadata.

    Raises
    ------
    FileNotFoundError
        If ``file_path`` does not exist.
    ValueError, RuntimeError
        Propagated from loader / splitter on malformed input.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: '{file_path}'")

    # 1. Load raw pages -------------------------------------------------------
    raw_docs: List[Document] = _load_documents(file_path)
    full_text: str = "\n\n".join(doc.page_content for doc in raw_docs)
    doc_id: str = _stable_doc_id(file_path)

    # 2. Split into PARENT chunks (1500–2000 tokens) --------------------------
    parent_splitter = _build_splitter(chunk_tokens=PARENT_CHUNK_TOKENS, overlap_tokens=100)
    parent_raw: List[str] = parent_splitter.split_text(full_text)

    parent_chunks: List[Document] = []
    for idx, text in enumerate(parent_raw):
        section_heading = _extract_section_heading(text, fallback=f"Section {idx + 1}")
        parent_id = f"{doc_id}_parent_{idx}"
        parent_chunks.append(
            Document(
                page_content=text,
                metadata={
                    "doc_id": doc_id,
                    "parent_id": parent_id,
                    "parent_index": idx,
                    "source": str(file_path),
                    "filename": file_path.name,
                    "chapter_or_section": section_heading,
                    "subject_name": subject_name or "",
                    "subject_domain": subject_domain or "",
                    "token_estimate": _estimate_tokens(text),
                },
            )
        )

    # 3. Persist parents to LocalFileStore ------------------------------------
    _persist_parents_to_store(parent_chunks, store_dir=Path(store_dir))

    # 4. Split each PARENT into CHILD chunks (300–400 tokens) -----------------
    child_splitter = _build_splitter(chunk_tokens=CHILD_CHUNK_TOKENS, overlap_tokens=40)
    child_chunks: List[Document] = []

    for parent_doc in parent_chunks:
        child_texts: List[str] = child_splitter.split_text(parent_doc.page_content)
        for c_idx, c_text in enumerate(child_texts):
            chunk_type: ChunkType = _classify_chunk_type(c_text)
            child_id = f"{parent_doc.metadata['parent_id']}_child_{c_idx}"
            child_chunks.append(
                Document(
                    page_content=c_text,
                    metadata={
                        # Lineage
                        "doc_id": doc_id,
                        "parent_id": parent_doc.metadata["parent_id"],
                        "child_id": child_id,
                        "child_index": c_idx,
                        # Provenance
                        "source": parent_doc.metadata["source"],
                        "filename": file_path.name,
                        "chapter_or_section": parent_doc.metadata["chapter_or_section"],
                        # Pedagogy
                        "chunk_type": chunk_type,
                        "subject_name": subject_name or "",
                        "subject_domain": subject_domain or "",
                        # Size
                        "token_estimate": _estimate_tokens(c_text),
                    },
                )
            )

    logger.info(
        "Ingestion complete for '%s': %d parent chunk(s), %d child chunk(s).",
        file_path.name,
        len(parent_chunks),
        len(child_chunks),
    )
    return parent_chunks, child_chunks


def ingest_multiple_documents(
    file_paths: List[str | Path],
    store_dir: str | Path = "./doc_store",
    subject_name: Optional[str] = None,
    subject_domain: Optional[str] = None,
) -> Tuple[List[Document], List[Document]]:
    """
    Batch-ingest a list of documents, aggregating all parent and child chunks.

    Skips individual files that fail to parse (logs a warning) so that a single
    corrupted upload does not abort the entire batch.

    Returns
    -------
    all_parents:
        Aggregated parent Documents from all successfully ingested files.
    all_children:
        Aggregated child Documents from all successfully ingested files.
    """
    all_parents: List[Document] = []
    all_children: List[Document] = []

    for fp in file_paths:
        try:
            parents, children = ingest_document(
                fp,
                store_dir=store_dir,
                subject_name=subject_name,
                subject_domain=subject_domain,
            )
            all_parents.extend(parents)
            all_children.extend(children)
        except (FileNotFoundError, ValueError, RuntimeError) as exc:
            logger.warning("Skipping '%s' — %s", fp, exc)

    return all_parents, all_children