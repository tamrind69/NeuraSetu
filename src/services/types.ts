import {
  LessonData,
  TopicPreset,
  PersonalizationConfig,
  UploadedFileState,
  ChatMessage,
  AdaptiveFeedbackData,
  AssessmentResult,
  EvaluationResult,
  TestSubmission,
  AssignmentSubmissionData,
  TeacherPersonaId,
  AssessmentQuestion,
  TestItem,
  AssignmentItem,
  LearnerProfile,
  LessonPlanRequest,
  LessonPlanResponse,
  RAGQueryResult,
  KnowledgeChunk,
  DocumentUploadResponse,
  TeachingVideoSegment,
  VideoChapter,
  ModuleVideoData,
  AvatarTelemetry,
  SendMessageRequest,
  SocraticHintRequest,
} from '../types';

// Re-export core AI data contracts for service consumers
export type {
  LearnerProfile,
  LessonPlanRequest,
  LessonPlanResponse,
  RAGQueryResult,
  KnowledgeChunk,
  DocumentUploadResponse,
  TeachingVideoSegment,
  VideoChapter,
  ModuleVideoData,
  AvatarTelemetry,
  EvaluationResult,
  AdaptiveFeedbackData,
  AssessmentResult,
  AssessmentQuestion,
  SendMessageRequest,
  SocraticHintRequest,
};

// ==========================================
// 1. Lesson Plan Service Types
// ==========================================
export type LessonPlanGenerationRequest = LessonPlanRequest;

export interface LessonPlanUpdateRequest {
  lessonId: string;
  updates: Partial<LessonData>;
}

export interface ExportLessonPlanResponse {
  lessonId: string;
  format: 'json' | 'markdown' | 'pdf';
  filename: string;
  content: string;
  generatedAt: string;
}

// ==========================================
// 2. RAG Service Types
// ==========================================
export interface QueryKnowledgeBaseRequest {
  query: string;
  documentId?: string;
  topK?: number;
  subjectFilter?: string;
}

// ==========================================
// 3. TTS (Text-to-Speech) Service Types
// ==========================================
export interface VoiceProfile {
  id: string;
  personaId: TeacherPersonaId;
  name: string;
  gender: 'female' | 'male';
  accent: string;
  audioSampleUrl: string;
  toneDescription: string;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  personaId?: TeacherPersonaId;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioUrl: string;
  durationSeconds: number;
  voiceId: string;
  waveformSnippet: number[];
}

export interface AudioTrackInfo {
  trackId: string;
  moduleId: string;
  audioUrl: string;
  durationSeconds: number;
  transcriptCuePoints: { timestamp: number; text: string }[];
}

// ==========================================
// 4. Video Service Types
// ==========================================
export interface VideoGenerationOptions {
  resolution?: '720p' | '1080p' | '4k';
  avatarEnabled?: boolean;
  slideOverlayEnabled?: boolean;
  captionsEnabled?: boolean;
}

// ==========================================
// 5. Evaluation Service Types
// ==========================================
export interface CheckpointEvaluationRequest {
  questionId: string;
  selectedOptionId: string;
  confidence?: string;
  checkpoint: LessonData['checkpoint'];
  personaId?: TeacherPersonaId;
}

export interface AssessmentEvaluationRequest {
  answers: Record<string, any>;
  questions: AssessmentQuestion[];
  timeSpentSeconds?: number;
  studentName?: string;
  lessonTopic?: string;
}

export interface TestEvaluationRequest {
  testId: string;
  testItem: TestItem;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  timeSpentSeconds: number;
}

export interface AssignmentEvaluationRequest {
  assignmentId: string;
  assignmentItem: AssignmentItem;
  answers: Record<string, string>;
  uploadedFileName?: string;
  uploadedFileSize?: string;
}

// ==========================================
// 6. Translation Service Types
// ==========================================
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  rtl?: boolean;
}

export interface TranslationRequest {
  text: string;
  targetLanguageCode: string;
  sourceLanguageCode?: string;
  context?: 'academic-bio' | 'conversational' | 'caption' | 'analogy';
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  detectedConfidence: number;
}

export interface CaptionItem {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker: string;
  text: string;
}
