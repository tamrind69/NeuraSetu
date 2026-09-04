import { Router, Request, Response } from 'express';
import { ModuleVideoData, VideoChapter } from '../../src/types';

export const videoRouter = Router();

const sampleChapters: VideoChapter[] = [
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
    title: 'Rotary ATP Synthase & Chemiosmotic Coupling',
    startTimeSeconds: 1035,
    durationSeconds: 285,
    slideId: 4,
    hasInteractiveCheckpoint: false,
  },
];

/**
 * POST /api/video
 * Generates or retrieves teaching video stream metadata and chapter breakdown.
 */
videoRouter.post('/', (req: Request, res: Response) => {
  try {
    const { lessonId = 'lesson-1', moduleId = 3 } = req.body || {};

    const videoData: ModuleVideoData = {
      lessonId,
      moduleId,
      videoTitle: 'Module 3: Electron Transport Chain & Proton Gradients',
      streamUrl: '/videos/modules/etc-simulation.mp4',
      totalDurationSeconds: 1320,
      currentTimeSeconds: 725,
      chapters: sampleChapters,
      subtitlesUrl: '/subtitles/module-3-en.vtt',
    };

    res.status(200).json(videoData);
  } catch (error) {
    console.error('Error generating video metadata:', error);
    res.status(500).json({
      error: 'Failed to generate video stream',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/video/:lessonId/:moduleId
 * Retrieves video metadata for a specific module.
 */
videoRouter.get('/:lessonId/:moduleId', (req: Request, res: Response) => {
  const { lessonId, moduleId } = req.params;
  const modNum = parseInt(moduleId, 10) || 1;

  res.status(200).json({
    lessonId,
    moduleId: modNum,
    videoTitle: `Module ${modNum}: Electron Transport Chain & Proton Gradients`,
    streamUrl: '/videos/modules/etc-simulation.mp4',
    totalDurationSeconds: 1320,
    currentTimeSeconds: 725,
    chapters: sampleChapters,
    subtitlesUrl: '/subtitles/module-3-en.vtt',
  });
});
