import {
  ModuleVideoData,
  VideoChapter,
  VideoGenerationOptions,
  AvatarTelemetry,
  TeachingVideoSegment,
} from './types';
import { apiPost } from './apiClient';

/**
 * Service managing lecture video streams, scene metadata, timeline chapters, and avatar animation telemetry.
 * Connects to Express backend (/api/video) with local fallbacks.
 */
class VideoService {
  private defaultChapters: VideoChapter[] = [
    {
      id: 'chap-1',
      title: 'Mitochondrial Anatomy & Cristae Compartmentalization',
      startTimeSeconds: 0,
      durationSeconds: 320,
      slideId: 1,
      hasInteractiveCheckpoint: false,
    },
    {
      id: 'chap-2',
      title: 'Complexes I to IV Electron Cascade',
      startTimeSeconds: 320,
      durationSeconds: 405,
      slideId: 2,
      hasInteractiveCheckpoint: false,
    },
    {
      id: 'chap-3',
      title: 'Proton Gradient Localization & Checkpoint',
      startTimeSeconds: 725,
      durationSeconds: 310,
      slideId: 3,
      hasInteractiveCheckpoint: true,
    },
    {
      id: 'chap-4',
      title: 'ATP Synthase Chemiosmotic Coupling',
      startTimeSeconds: 1035,
      durationSeconds: 285,
      slideId: 4,
      hasInteractiveCheckpoint: false,
    },
  ];

  /**
   * Retrieves video stream metadata, chapter markers, and interactive checkpoint positions for a module.
   */
  async getModuleVideo(lessonId: string, moduleId: number): Promise<ModuleVideoData> {
    const fallback = async (): Promise<ModuleVideoData> => {
      await new Promise((r) => setTimeout(r, 200));

      return {
        lessonId,
        moduleId,
        videoTitle: 'Module 3: Electron Transport Chain & Proton Gradients',
        streamUrl: '/videos/modules/etc-simulation.mp4',
        totalDurationSeconds: 1320,
        currentTimeSeconds: 725,
        chapters: this.defaultChapters,
        subtitlesUrl: '/subtitles/module-3-en.vtt',
      };
    };

    return apiPost<ModuleVideoData>(
      '/video',
      {
        lessonId,
        moduleId,
      },
      fallback
    );
  }

  /**
   * Retrieves timeline chapters with associated slide mappings and checkpoint indicators.
   */
  async getVideoChapters(_lessonId: string): Promise<VideoChapter[]> {
    return this.defaultChapters;
  }

  /**
   * Retrieves fine-grained video lecture segments aligning narration scripts with visual cues.
   */
  async getVideoSegments(_lessonId: string, _moduleId: number): Promise<TeachingVideoSegment[]> {
    await new Promise((r) => setTimeout(r, 100));
    return [
      {
        id: 'seg-1',
        timestamp: 0,
        timestampStart: 0,
        timestampEnd: 180,
        script:
          'Welcome to class! We are examining the inner mitochondrial membrane where Complexes I through IV pump protons.',
        visualCue: 'Highlight cristae folds and inner mitochondrial membrane',
        slideId: 1,
        activeComplexId: 'Membrane-Overview',
        hasCheckpoint: false,
      },
      {
        id: 'seg-2',
        timestamp: 320,
        timestampStart: 320,
        timestampEnd: 725,
        script:
          'As high-energy electrons cascade from NADH through Complex I to Ubiquinone, free energy drives protons across the barrier.',
        visualCue: 'Animate electron transfer and upward blue H+ vectors',
        slideId: 2,
        activeComplexId: 'Complex-I',
        hasCheckpoint: false,
      },
      {
        id: 'seg-3',
        timestamp: 725,
        timestampStart: 725,
        timestampEnd: 1035,
        script:
          'Notice how the intermembrane space turns into a dense proton reservoir with high potential energy (~140mV).',
        visualCue: 'Pulsing glow in intermembrane space with question prompt overlay',
        slideId: 3,
        activeComplexId: 'Intermembrane-Space',
        hasCheckpoint: true,
      },
      {
        id: 'seg-4',
        timestamp: 1035,
        timestampStart: 1035,
        timestampEnd: 1320,
        script:
          'The electrochemical battery discharges back through the ATP Synthase turbine, phosphorylating ADP into ATP.',
        visualCue: 'Rotate ATP Synthase rotor and emit ATP spark particles',
        slideId: 4,
        activeComplexId: 'ATP-Synthase',
        hasCheckpoint: false,
      },
    ];
  }

  /**
   * Triggers a lecture video generation/rendering job.
   */
  async generateLectureVideo(
    _lessonId: string,
    _options?: VideoGenerationOptions
  ): Promise<{ jobId: string; status: 'queued' | 'rendering' | 'completed' }> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      jobId: `job-${Date.now()}`,
      status: 'completed',
    };
  }

  /**
   * Retrieves real-time avatar animation telemetry for lip-sync and gestures.
   */
  async getAvatarTelemetry(teacherId: string, timestamp: number): Promise<AvatarTelemetry> {
    const isSpeaking = timestamp % 10 < 7;
    return {
      teacherId,
      isSpeaking,
      mouthOpen: isSpeaking ? Math.min(1, Math.sin(timestamp * 5) * 0.5 + 0.5) : 0,
      gestureState: isSpeaking ? 'explaining' : 'idle',
      confidence: 0.98,
    };
  }
}

export const videoService = new VideoService();
