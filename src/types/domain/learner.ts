/**
 * Learner & Mentor Persona Domain Types
 */

export type TeacherPersonaId = 'evelyn' | 'marcus' | 'maya';

export interface TeacherPersona {
  id: TeacherPersonaId;
  name: string;
  title: string;
  avatar: string;
  specialty: string;
  toneDescription: string;
  sampleVoiceQuote: string;
  accentColor: string;
  badge: string;
}

export type LearningStyle = 'visual' | 'conceptual' | 'storytelling' | 'problem-solving';
export type Pace = 'steady' | 'fast-track' | 'deep-dive';
export type Difficulty = 'foundational' | 'standard' | 'advanced';

export interface PersonalizationConfig {
  personaId: TeacherPersonaId;
  learningStyle: LearningStyle;
  pace: Pace;
  difficulty: Difficulty;
  pauseForCheckpoints: boolean;
  socraticHintsEnabled: boolean;
  includeAnalogies: boolean;
}

/**
 * Base User Profile representing active student metadata and gamification stats.
 */
export interface UserProfile {
  name: string;
  avatar: string;
  gradeLevel: string;
  xp: number;
  streakDays: number;
  completedLessons: number;
  accuracyRate: number;
  studyHours: number;
}

/**
 * Comprehensive Learner Profile extending UserProfile with pedagogical preferences,
 * target examinations, and diagnosed cognitive strengths.
 */
export interface LearnerProfile extends UserProfile {
  id?: string;
  email?: string;
  learningStyle?: LearningStyle;
  preferredPace?: Pace;
  targetExam?: string; // e.g., 'AP Biology', 'MCAT', 'SAT Subject'
  assignedTeacherPersonaId?: TeacherPersonaId;
  strongConceptAreas?: string[];
  growthAreas?: string[];
  accommodations?: string[];
}
