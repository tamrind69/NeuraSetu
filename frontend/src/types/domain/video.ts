/**
 * Video chapter definition mapping timestamps to visual slides and checkpoints.
 */
export interface VideoChapter {
  id: string;
  title: string;
  startTimeSeconds: number;
  durationSeconds: number;
  slideId: number;
  hasInteractiveCheckpoint: boolean;
}

/**
 * Teaching video segment contract aligning spoken narration with visual diagram cues and timeline marks.
 */
export interface TeachingVideoSegment {
  id: string;
  
  /**
   * Primary timestamp in seconds where this segment activates.
   */
  timestamp: number;

  /**
   * Precise start timestamp in seconds.
   */
  timestampStart: number;

  /**
   * Precise end timestamp in seconds.
   */
  timestampEnd: number;

  /**
   * The spoken explanation or lecture dialogue delivered by the AI teacher avatar.
   */
  script: string;

  /**
   * Actionable visual cue directing student focus (e.g. 'Highlight Complex I', 'Zoom cristae membrane', 'Show H+ accumulation').
   */
  visualCue: string;

  /**
   * Optional associated slide index or ID.
   */
  slideId?: number;

  /**
   * Biochemical or conceptual complex currently active (e.g. 'Complex-I', 'ATP-Synthase').
   */
  activeComplexId?: string;

  /**
   * Whether an interactive checkpoint prompt triggers at the conclusion of this segment.
   */
  hasCheckpoint?: boolean;
}

export interface ModuleVideoData {
  lessonId: string;
  moduleId: number;
  videoTitle: string;
  streamUrl: string;
  totalDurationSeconds: number;
  currentTimeSeconds: number;
  chapters: VideoChapter[];
  segments?: TeachingVideoSegment[];
  subtitlesUrl?: string;
}

export interface AvatarTelemetry {
  teacherId: string;
  isSpeaking: boolean;
  mouthOpen: number; // 0.0 to 1.0
  gestureState: 'idle' | 'pointing' | 'explaining' | 'affirming';
  confidence: number;
}
