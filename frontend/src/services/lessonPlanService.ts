import { LessonData, TopicPreset, LessonPlanRequest, LessonPlanResponse } from '../types';
import { defaultLesson, topicPresets } from '../data/mockData';
import {
  LessonPlanGenerationRequest,
  LessonPlanUpdateRequest,
  ExportLessonPlanResponse,
} from './types';
import { apiGet, apiPost } from './apiClient';

/**
 * Service handling curriculum and lesson plan generation, retrieval, updates, and export.
 * Interfaces with the Express backend (/api/lesson-plan) with local fallbacks.
 */
class LessonPlanService {
  /**
   * Generates a structured pedagogical lesson plan from topic, syllabus, or uploaded document context.
   */
  async generateLessonPlan(request: LessonPlanGenerationRequest): Promise<LessonData> {
    const fallback = async (): Promise<LessonPlanResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const learningStyle = request.personalization?.learningStyle || 'visual';
      const pace = request.personalization?.pace || 'balanced';

      const lesson: LessonData = {
        ...defaultLesson,
        id: `lesson-${Date.now()}`,
        title: request.topicTitle || defaultLesson.title,
        subject: request.subject || defaultLesson.subject,
        grade: request.gradeLevel || defaultLesson.grade,
        sourceType: request.sourceType === 'document' ? 'document' : 'topic',
        overview: `Personalized AI lesson synthesized for ${request.subject || 'Biology'}: "${
          request.topicTitle || defaultLesson.title
        }". Tailored for ${learningStyle} learners with a ${pace} pace under the guidance of Dr. Evelyn Vance.`,
        learningObjectives: [
          `Master fundamental principles of ${request.topicTitle || defaultLesson.title}.`,
          'Trace spatial localization across biological membranes and biochemical compartments.',
          'Analyze thermodynamic gradients and stoichiometric ATP energy yields.',
          'Synthesize clinical and physiological implications of metabolic inhibitors.',
        ],
      };

      return {
        lesson,
        success: true,
        generationId: `gen-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-2.0-flash-fallback',
        estimatedStudyTimeMinutes: lesson.estimatedTotalMinutes,
        curriculumOutline: lesson.modules,
      };
    };

    const response = await apiPost<LessonPlanResponse>('/lesson-plan', request, fallback);
    return response.lesson;
  }

  /**
   * Synthesizes a lesson plan and returns a comprehensive LessonPlanResponse envelope.
   */
  async synthesizePlan(request: LessonPlanRequest): Promise<LessonPlanResponse> {
    const fallback = async (): Promise<LessonPlanResponse> => {
      const lesson = await this.generateLessonPlan(request);
      return {
        lesson,
        success: true,
        generationId: `gen-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-2.0-flash-fallback',
        estimatedStudyTimeMinutes: lesson.estimatedTotalMinutes,
        curriculumOutline: lesson.modules,
      };
    };

    return apiPost<LessonPlanResponse>('/lesson-plan', request, fallback);
  }

  /**
   * Retrieves a saved lesson plan by ID.
   */
  async getLessonPlan(lessonId: string): Promise<LessonData> {
    const fallback = async (): Promise<LessonData> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        ...defaultLesson,
        id: lessonId,
      };
    };

    return apiGet<LessonData>(`/lesson-plan/${lessonId}`, fallback);
  }

  /**
   * Updates modules or sections of an existing lesson plan.
   */
  async updateLessonPlan(request: LessonPlanUpdateRequest): Promise<LessonData> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      ...defaultLesson,
      id: request.lessonId,
      ...request.updates,
    };
  }

  /**
   * Returns curated curriculum topic presets.
   */
  async getTopicPresets(): Promise<TopicPreset[]> {
    const fallback = async (): Promise<TopicPreset[]> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return topicPresets;
    };

    return apiGet<TopicPreset[]>('/lesson-plan/presets', fallback);
  }

  /**
   * Exports a lesson plan into Markdown or JSON format.
   */
  async exportLessonPlan(
    lessonId: string,
    format: 'json' | 'markdown' | 'pdf' = 'markdown'
  ): Promise<ExportLessonPlanResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let content = '';
    if (format === 'json') {
      content = JSON.stringify(defaultLesson, null, 2);
    } else {
      content = `# ${defaultLesson.title}\n\n**Subject**: ${defaultLesson.subject} | **Grade**: ${defaultLesson.grade}\n\n## Overview\n${defaultLesson.overview}\n\n## Learning Objectives\n${defaultLesson.learningObjectives.map((o) => `- ${o}`).join('\n')}\n\n## Modules\n${defaultLesson.modules.map((m) => `### ${m.title} (${m.durationMinutes}m)\n${m.description}`).join('\n\n')}`;
    }

    return {
      lessonId,
      format,
      filename: `lesson-plan-${lessonId}.${format === 'json' ? 'json' : 'md'}`,
      content,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const lessonPlanService = new LessonPlanService();
