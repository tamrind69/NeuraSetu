export interface UploadedFileState {
  name: string;
  size: string;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  extractedTopics: string[];
}

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  sourceDocument: string;
  pageNumber?: number;
  relevanceScore: number;
  tags: string[];
}

export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  fileSize: string;
  totalChunks: number;
  extractedTopics: string[];
  status: 'ready' | 'error';
  summary?: string;
}

/**
 * Result data contract returned from semantic RAG vector retrieval across ingested course materials.
 */
export interface RAGQueryResult {
  query: string;
  chunks: KnowledgeChunk[];
  totalChunksFound: number;
  highestScore: number;
  suggestedConcepts: string[];
  sourceDocuments: string[];
  executionTimeMs?: number;
}
