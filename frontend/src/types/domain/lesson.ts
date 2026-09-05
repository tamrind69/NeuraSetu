import { LearnerProfile, PersonalizationConfig } from './learner';
import { CheckpointQuestion, AssessmentQuestion } from './evaluation';

export interface LessonModule {
  id: string;
  title: string;
  durationMinutes: number;
  timestampStart: number; // in seconds
  description: string;
  keyPoints: string[];
  hasCheckpoint: boolean;
}

export interface VocabularyTerm {
  term: string;
  definition: string;
  example: string;
}

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  diagramType: 'diagram' | 'chemical-pathway' | 'formula' | 'comparison' | 'code';
  content: string[];
  visualSvgSnippet?: string;
  teacherNote: string;
  keyHighlight?: string;
}

export interface LessonData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  sourceType: 'topic' | 'document';
  sourceName?: string;
  overview: string;
  estimatedTotalMinutes: number;
  modules: LessonModule[];
  learningObjectives: string[];
  vocabulary: VocabularyTerm[];
  prerequisites: string[];
  slides: SlideData[];
  checkpoint: CheckpointQuestion;
  assessmentQuestions: AssessmentQuestion[];
}

export interface TopicPreset {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  estimatedMinutes: number;
  concepts: string[];
  iconName: string;
  colorScheme: string;
}

/**
 * Data contract for requesting automated AI curriculum and lesson plan generation.
 */
export interface LessonPlanRequest {
  topicTitle: string;
  subject: string;
  gradeLevel?: string;
  learnerProfile?: LearnerProfile;
  personalization?: PersonalizationConfig;
  sourceType?: 'topic' | 'document' | 'curated';
  documentId?: string;
  targetDurationMinutes?: number;
  pedagogicalGoal?: string;
  notes?: string;
}

/**
 * Structured response payload containing the synthesized lesson plan and metadata.
 */
export interface LessonPlanResponse {
  lesson: LessonData;
  success: boolean;
  generationId: string;
  generatedAt: string;
  modelUsed?: string;
  estimatedStudyTimeMinutes: number;
  curriculumOutline: LessonModule[];
}
