import { Difficulty, TeacherPersonaId } from './learner';

/**
 * Question format for interactive mid-lecture checkpoints.
 */
export interface CheckpointQuestion {
  id: string;
  timestamp: number;
  title: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  socraticHint: string;
  conceptBadge: string;
}

/**
 * Universal evaluation result contract for pedagogical diagnostics.
 * Includes correctness, identified misconceptions, and structured feedback.
 */
export interface EvaluationResult {
  /**
   * Whether the student's submission / option choice was scientifically accurate.
   */
  correct: boolean;

  /**
   * Diagnostic misconception identified by the AI (e.g. 'Confusing proton gradient with electron carrier flow').
   */
  misconception?: string;

  /**
   * Concise actionable feedback presented to the learner.
   */
  feedback: string;

  /**
   * Detailed scientific explanation of the phenomenon.
   */
  explanation: string;

  /**
   * Step-by-step Socratic breakdown guiding the student to self-correction.
   */
  socraticBreakdown?: string;

  /**
   * Real-world macroscopic analogy bridging abstract concept to intuition.
   */
  followUpAnalogy?: string;

  /**
   * Mastery XP awarded for the interaction.
   */
  masteryPointsEarned?: number;

  /**
   * Recommended next pedagogical step (e.g. review diagram, proceed).
   */
  recommendedNextAction?: string;
}

/**
 * Adaptive feedback data structure used for checkpoint question review pages.
 * Extends EvaluationResult while preserving backward-compatible isCorrect property.
 */
export interface AdaptiveFeedbackData extends EvaluationResult {
  isCorrect: boolean;
  selectedOptionId: string;
  primaryHeading: string;
}

/**
 * Standardized assessment item supporting multiple formats (multiple-choice, scenario, sequencing).
 */
export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'scenario' | 'sequencing';
  prompt: string;
  contextSnippet?: string;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  sequenceItems?: {
    id: string;
    text: string;
    correctIndex: number;
  }[];
  explanation: string;
  topicTag: string;
  difficulty?: Difficulty;
  hints?: string[];
  conceptBadge?: string;
  learningObjectiveId?: string;
}

/**
 * Aggregate diagnostic assessment report with topic mastery breakdown.
 */
export interface AssessmentResult {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  topicMastery: {
    topic: string;
    percentage: number;
    status: 'Mastered' | 'Proficient' | 'Needs Review';
  }[];
  aiSummary: string;
  strengths: string[];
  focusAreas: string[];
}
