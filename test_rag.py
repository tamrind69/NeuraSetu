from pathlib import Path

from rag.ingestion import ingest_document
from rag.embedding import bm25_search
from rag.embedding import (
    get_embedding_model,
    build_chroma_vectorstore,
    build_bm25_index,
)

from rag.retrieval import (
    LessonRetrievalRequest,
    retrieve_lesson_context,
)


PDF_PATH = "test.pdf"

STORE_DIR = "./data/test_rag/doc_store"
CHROMA_DIR = "./data/test_rag/chroma"
BM25_PATH = "./data/test_rag/bm25_index.pkl"


def main():
    print("=== RAG TEST ===")

    # 1. Check document
    if not Path(PDF_PATH).exists():
        print(f"ERROR: Put a PDF at {PDF_PATH}")
        return

    # 2. Ingest document
    print("\n[1] Ingesting document...")

    parent_chunks, child_chunks = ingest_document(
        PDF_PATH,
        store_dir=STORE_DIR,
    )

    print(f"Parent chunks: {len(parent_chunks)}")
    print(f"Child chunks:  {len(child_chunks)}")

    # 3. Load embedding model
    print("\n[2] Loading BGE-M3...")

    embedding_model = get_embedding_model()

    print("Embedding model loaded.")

    # 4. Build Chroma
    print("\n[3] Building ChromaDB...")

    vectorstore = build_chroma_vectorstore(
        child_chunks,
        embedding_model,
        persist_directory=CHROMA_DIR,
    )

    print("ChromaDB built.")

    # 5. Build BM25
    print("\n[4] Building BM25...")

    bm25, tokenised_corpus = build_bm25_index(
    child_chunks,
    bm25_path=BM25_PATH,
    )

    print("BM25 built.")

    # 6. Test semantic retrieval
    print("\n[5] Testing retrieval...")

    query = input("\nEnter a question about the PDF: ")

    results = vectorstore.similarity_search(
        query,
        k=5,
    )

    print("\n=== RESULTS ===")

    for i, doc in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print(doc.page_content[:500])
        print("Metadata:", doc.metadata)

    print("\n=== RAG TEST COMPLETE ===")


    bm25_results = bm25_search(
    bm25,
    child_chunks,
    query,
    top_k=5,
    )

    print("\n=== BM25 RESULTS ===")

    for i, doc in enumerate(bm25_results, 1):
        print(f"\n--- Result {i} ---")
        print(doc.page_content[:500])

        # 7. Test full hybrid retrieval
    print("\n[6] Testing full hybrid retrieval...")

    request = LessonRetrievalRequest(
        topic_title="XGBoost",
        subject_name="Machine Learning",
        learning_objectives=[
            "Understand what XGBoost is",
            "Understand how gradient boosting works",
            "Understand the role of regularization in XGBoost",
        ],
        subject_domain="Computer Science",
        target_academic_level="College / Undergraduate",
        lesson_duration="20 - 25 mins",
        pedagogical_highlights=[
            "Explain concepts intuitively",
            "Use simple examples",
            "Connect theory to practical applications",
        ],
        language="English",
    )

    hybrid_results = retrieve_lesson_context(
        request=request,
        vectorstore=vectorstore,
        bm25=bm25,
        child_chunks=child_chunks,
        store_dir=STORE_DIR,
    )

    print("\n=== HYBRID RAG RESULTS ===")
    print(hybrid_results)


if __name__ == "__main__":
    main()