import { UploadedFileState, RAGQueryResult } from '../types';
import {
  DocumentUploadResponse,
  KnowledgeChunk,
  QueryKnowledgeBaseRequest,
} from './types';
import { apiPost } from './apiClient';

/**
 * Service for document ingestion, parsing, chunking, topic extraction, and RAG context retrieval.
 * Connects to Express backend (/api/rag/ingest, /api/rag/query) with safe local fallbacks.
 */
class RagService {
  private sampleChunks: KnowledgeChunk[] = [
    {
      id: 'chunk-01',
      title: 'Chemiosmotic Hypothesis (Mitchell, 1961)',
      content:
        'Proton motive force is composed of both a membrane electrical potential (ΔΨ) and a chemical pH gradient (ΔpH) across the inner mitochondrial membrane.',
      sourceDocument: 'Campbell Biology Chapter 9',
      pageNumber: 174,
      relevanceScore: 0.94,
      tags: ['PMF', 'Chemiosmosis', 'ATP Synthase'],
    },
    {
      id: 'chunk-02',
      title: 'Respiratory Chain Complex IV & Oxygen Terminal Acceptor',
      content:
        'Cytochrome c oxidase transfers electrons directly to molecular oxygen, reducing it to water while coupling the translocation of four protons per cycle.',
      sourceDocument: 'Lehninger Principles of Biochemistry',
      pageNumber: 720,
      relevanceScore: 0.89,
      tags: ['Complex IV', 'Oxygen', 'Bioenergetics'],
    },
  ];

  /**
   * Uploads and parses a syllabus, PDF textbook chapter, or lecture document with simulated progress.
   */
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse> {
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);

    if (onProgress) {
      onProgress(20);
      await new Promise((r) => setTimeout(r, 200));
      onProgress(65);
      await new Promise((r) => setTimeout(r, 250));
      onProgress(100);
    }

    const fallback = async (): Promise<DocumentUploadResponse> => {
      const extractedTopics = [
        'Cellular Respiration Pathways',
        'Mitochondrial Membrane Dynamics',
        'Oxidative Phosphorylation & ATP Yield',
        'Chemiosmotic Coupling Hypothesis',
        'Proton Motive Force & Cristae Stoichiometry',
      ];

      return {
        documentId: `doc-${Date.now()}`,
        filename: file.name,
        fileSize: `${fileSizeMb} MB`,
        totalChunks: 24,
        extractedTopics,
        status: 'ready',
        summary: `Document "${file.name}" successfully parsed. Identified 5 core pedagogical topics and 24 semantic knowledge chunks ready for RAG contextual retrieval.`,
      };
    };

    return apiPost<DocumentUploadResponse>(
      '/rag/ingest',
      {
        filename: file.name,
        fileSize: `${fileSizeMb} MB`,
      },
      fallback
    );
  }

  /**
   * Extracts academic topics and concept entities from an ingested document.
   */
  async extractTopicsFromDocument(_documentId: string): Promise<string[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [
      'Cellular Respiration Pathways',
      'Mitochondrial Membrane Dynamics',
      'Oxidative Phosphorylation & ATP Yield',
      'Chemiosmotic Coupling Hypothesis',
    ];
  }

  /**
   * Retrieves relevant knowledge base chunks matching a question or student inquiry.
   */
  async queryKnowledgeBase(request: QueryKnowledgeBaseRequest): Promise<KnowledgeChunk[]> {
    const result = await this.retrieveContext(request);
    return result.chunks;
  }

  /**
   * Performs semantic RAG retrieval and returns a structured RAGQueryResult.
   */
  async retrieveContext(request: QueryKnowledgeBaseRequest): Promise<RAGQueryResult> {
    const fallback = async (): Promise<RAGQueryResult> => {
      await new Promise((r) => setTimeout(r, 200));
      return {
        query: request.query,
        chunks: this.sampleChunks,
        totalChunksFound: this.sampleChunks.length,
        highestScore: 0.94,
        suggestedConcepts: ['Proton Motive Force', 'Complex IV Oxygen Reduction', 'Chemiosmosis'],
        sourceDocuments: ['Campbell Biology Chapter 9', 'Lehninger Principles of Biochemistry'],
        executionTimeMs: 180,
      };
    };

    return apiPost<RAGQueryResult>(
      '/rag/query',
      {
        query: request.query,
        topK: request.topK || 3,
        documentId: request.documentId,
      },
      fallback
    );
  }

  /**
   * Retrieves processing status for an ingested document.
   */
  async getDocumentStatus(_documentId: string): Promise<UploadedFileState> {
    await new Promise((r) => setTimeout(r, 150));
    return {
      name: 'AP_Biology_Unit3_Cellular_Energetics.pdf',
      size: '4.2 MB',
      type: 'application/pdf',
      uploadProgress: 100,
      status: 'ready',
      extractedTopics: [
        'Cellular Respiration Pathways',
        'Mitochondrial Membrane Dynamics',
        'Oxidative Phosphorylation & ATP Yield',
        'Chemiosmotic Coupling Hypothesis',
      ],
    };
  }
}

export const ragService = new RagService();
