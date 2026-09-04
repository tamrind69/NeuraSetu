export interface TestQuestion {
  id: string;
  question: string;
  context?: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
  topicTag: string;
}

export interface TestItem {
  id: string;
  title: string;
  subject: string;
  category: string;
  description: string;
  questionCount: number;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard' | 'Advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number; // percentage (e.g. 90)
  correctCount?: number;
  totalQuestions?: number;
  timeSpentSeconds?: number;
  lastTakenDate?: string;
  questions: TestQuestion[];
}

export interface TestSubmission {
  testId: string;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  timeSpentSeconds: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions?: number;
  completedAt: string;
}
