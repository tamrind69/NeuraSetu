import { Router, Request, Response } from 'express';
import { defaultLesson, topicPresets } from '../../src/data/mockData';
import { LessonData, LessonPlanRequest, LessonPlanResponse } from '../../src/types';

export const lessonPlanRouter = Router();

/**
 * POST /api/lesson-plan
 * Synthesizes an AI lesson plan based on topic or uploaded syllabus context.
 */
lessonPlanRouter.post('/', (req: Request, res: Response) => {
  try {
    const body: LessonPlanRequest = req.body || {};

    const learningStyle = body.personalization?.learningStyle || 'visual';
    const pace = body.personalization?.pace || 'balanced';

    const generatedLesson: LessonData = {
      ...defaultLesson,
      id: `lesson-${Date.now()}`,
      title: body.topicTitle || defaultLesson.title,
      subject: body.subject || defaultLesson.subject,
      grade: body.gradeLevel || defaultLesson.grade,
      sourceType: body.sourceType === 'document' ? 'document' : 'topic',
      overview: `Personalized AI lesson synthesized for ${body.subject || 'Biology'}: "${
        body.topicTitle || defaultLesson.title
      }". Tailored for ${learningStyle} learners with a ${pace} pace under the guidance of Dr. Evelyn Vance.`,
      learningObjectives: [
        `Master fundamental principles of ${body.topicTitle || defaultLesson.title}.`,
        'Trace spatial localization across biological membranes and biochemical compartments.',
        'Analyze thermodynamic gradients and stoichiometric ATP energy yields.',
        'Synthesize clinical and physiological implications of metabolic inhibitors.',
      ],
    };

    const responseEnvelope: LessonPlanResponse = {
      lesson: generatedLesson,
      success: true,
      generationId: `gen-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      modelUsed: 'gemini-2.0-flash-stub',
      estimatedStudyTimeMinutes: generatedLesson.estimatedTotalMinutes || 45,
      curriculumOutline: generatedLesson.modules,
    };

    res.status(200).json(responseEnvelope);
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({
      error: 'Failed to synthesize lesson plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/lesson-plan/presets
 * Returns curated curriculum presets.
 */
lessonPlanRouter.get('/presets', (_req: Request, res: Response) => {
  res.status(200).json(topicPresets);
});

/**
 * GET /api/lesson-plan/:id
 * Retrieves a lesson plan by ID.
 */
lessonPlanRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({
    ...defaultLesson,
    id,
  });
});
