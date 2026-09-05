import { TeacherPersonaId } from './learner';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'teacher';
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isAudioSnippet?: boolean;
}

export interface SendMessageRequest {
  lessonId: string;
  studentName: string;
  studentAvatar: string;
  questionText: string;
  personaId: TeacherPersonaId;
  activeModuleIndex?: number;
  activeSlideTitle?: string;
  currentLessonTopic?: string;
}

export interface SocraticHintRequest {
  lessonTopic: string;
  checkpointPrompt: string;
  studentStuckOption?: string;
  personaId: TeacherPersonaId;
}
