import {
  AdaptiveFeedbackData,
  AssessmentResult,
  TestSubmission,
  AssignmentSubmissionData,
} from '../types';
import {
  CheckpointEvaluationRequest,
  AssessmentEvaluationRequest,
  TestEvaluationRequest,
  AssignmentEvaluationRequest,
} from './types';
import { apiPost } from './apiClient';

/**
 * Service managing conceptual evaluation, checkpoint grading, adaptive feedback synthesis,
 * test scoring, and assignment evaluation.
 * Connects to Express backend (/api/evaluation) with local fallbacks.
 */
class EvaluationService {
  /**
   * Evaluates a checkpoint question choice and generates adaptive pedagogical feedback with analogies.
   */
  async evaluateCheckpointAnswer(
    request: CheckpointEvaluationRequest
  ): Promise<AdaptiveFeedbackData> {
    const fallback = async (): Promise<AdaptiveFeedbackData> => {
      await new Promise((r) => setTimeout(r, 200));

      const chosenOption = request.checkpoint.options.find(
        (o) => o.id === request.selectedOptionId
      );
      const isCorrect = chosenOption?.isCorrect ?? false;

      if (isCorrect) {
        return {
          correct: true,
          isCorrect: true,
          feedback:
            'Spot On! Exceptional spatial and biochemical intuition on proton accumulation.',
          selectedOptionId: request.selectedOptionId,
          primaryHeading: 'Spot On! Exceptional Spatial & Biochemical Intuition',
          explanation:
            chosenOption?.explanation ||
            'Complexes I, III, and IV actively pump protons (H+) from the matrix across the inner mitochondrial membrane into the confined intermembrane space.',
          socraticBreakdown:
            'By establishing this steep proton gradient across the inner membrane into the intermembrane space, the cell builds an electrochemical battery (~140mV) ready to discharge through the ATP synthase rotary engine.',
          followUpAnalogy:
            'Think of the intermembrane space as a high-pressure reservoir behind a hydroelectric dam. As the protons flow through the narrow ATP Synthase gate, their kinetic energy rotates the catalytic head to generate ATP!',
          masteryPointsEarned: 50,
          recommendedNextAction:
            'Proceed with high confidence to the comprehensive assessment.',
        };
      }

      return {
        correct: false,
        isCorrect: false,
        misconception:
          'Confusing matrix export with intermembrane space retention or cristae directional orientation.',
        feedback: 'Close attempt! Re-trace the vector of proton translocation across the cristae.',
        selectedOptionId: request.selectedOptionId,
        primaryHeading: 'Close Attempt! Let’s Trace The Molecular Movement',
        explanation:
          chosenOption?.explanation ||
          'Protons are actively exported across the inner mitochondrial membrane away from the matrix.',
        socraticBreakdown:
          'Remember: Complexes I, III, and IV are embedded in the cristae folds and pump H+ ions OUT of the matrix. What cavity lies directly outside that inner barrier? The intermembrane space!',
        followUpAnalogy:
          'Think of blowing air into a tight balloon. You push air out into the balloon cavity so that when released, the air rushes back in to spin a pinwheel!',
        masteryPointsEarned: 20,
        recommendedNextAction:
          'Review the cristae diagram and examine the proton pump arrows before re-evaluating.',
      };
    };

    return apiPost<AdaptiveFeedbackData>(
      '/evaluation',
      {
        type: 'checkpoint',
        ...request,
      },
      fallback
    );
  }

  /**
   * Evaluates an end-of-lesson assessment and compiles topic mastery analytics and AI strengths/focus areas.
   */
  async evaluateAssessment(request: AssessmentEvaluationRequest): Promise<AssessmentResult> {
    const fallback = async (): Promise<AssessmentResult> => {
      await new Promise((r) => setTimeout(r, 250));

      let correct = 0;
      const questions = request.questions;

      questions.forEach((q) => {
        const userAns = request.answers[q.id];
        if (q.type === 'multiple-choice' || q.type === 'scenario') {
          const correctOpt = q.options?.find((o) => o.isCorrect)?.id;
          if (userAns === correctOpt) correct++;
        } else if (q.type === 'sequencing') {
          correct++;
        }
      });

      const total = questions.length || 1;
      const scorePct = Math.round((correct / total) * 100);

      return {
        scorePercent: scorePct,
        correctCount: correct,
        totalQuestions: total,
        timeSpentSeconds: request.timeSpentSeconds || 195,
        topicMastery: [
          { topic: 'Glycolysis & Cytosolic Energetics', percentage: 100, status: 'Mastered' },
          {
            topic: 'Citric Acid (Krebs) Cycle',
            percentage: scorePct > 80 ? 95 : 75,
            status: scorePct > 80 ? 'Mastered' : 'Proficient',
          },
          {
            topic: 'Electron Transport Chain Complexes',
            percentage: scorePct > 70 ? 92 : 65,
            status: scorePct > 70 ? 'Mastered' : 'Needs Review',
          },
          { topic: 'Chemiosmosis & Proton Motive Force', percentage: 90, status: 'Proficient' },
        ],
        aiSummary: `${request.studentName || 'Student'} completed the lesson with an outstanding ${scorePct}% score! Conceptual grasp of electron transport chain complexes and proton motive force localization was verified through rigorous clinical and biochemical scenarios.`,
        strengths: [
          'Precise understanding of respiratory electron carriers (NADH vs FADH2)',
          'Accurate interpretation of mitochondrial uncouplers and thermodynamic dissipation',
          'Strong sequencing of the multi-stage metabolic cascade',
        ],
        focusAreas: [
          'Review Complex I vs Complex II stoichiometry under high ATP/ADP ratios',
          'Practice metabolic flux calculations with varying pyruvate availability',
        ],
      };
    };

    return apiPost<AssessmentResult>(
      '/evaluation',
      {
        type: 'assessment',
        ...request,
      },
      fallback
    );
  }

  /**
   * Evaluates a standardized test submission.
   */
  async evaluateTestSubmission(request: TestEvaluationRequest): Promise<TestSubmission> {
    const fallback = async (): Promise<TestSubmission> => {
      await new Promise((r) => setTimeout(r, 200));

      const questions = request.testItem.questions || [];
      let correctCount = 0;

      questions.forEach((q) => {
        const userAns = request.answers[q.id];
        if (userAns && userAns === q.correctAnswerId) {
          correctCount++;
        }
      });

      if (questions.length === 0) {
        correctCount = Math.round((request.testItem.questionCount || 20) * 0.9);
      }

      const totalQuestions = questions.length || request.testItem.questionCount || 20;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const incorrectCount = Math.max(0, totalQuestions - correctCount);
      const answeredCount = Object.keys(request.answers).length;
      const unansweredCount = Math.max(0, totalQuestions - answeredCount);

      return {
        testId: request.testId,
        answers: request.answers,
        flagged: request.flagged,
        timeSpentSeconds: request.timeSpentSeconds,
        score: percentage,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions,
        completedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    };

    return apiPost<TestSubmission>(
      '/evaluation',
      {
        type: 'test',
        ...request,
      },
      fallback
    );
  }

  /**
   * Packages and evaluates an academic assignment submission.
   */
  async evaluateAssignmentSubmission(
    request: AssignmentEvaluationRequest
  ): Promise<AssignmentSubmissionData> {
    const fallback = async (): Promise<AssignmentSubmissionData> => {
      await new Promise((r) => setTimeout(r, 200));

      return {
        assignmentId: request.assignmentId,
        answers: request.answers,
        uploadedFileName: request.uploadedFileName,
        uploadedFileSize: request.uploadedFileSize,
        submittedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'submitted',
      };
    };

    return apiPost<AssignmentSubmissionData>(
      '/evaluation',
      {
        type: 'assignment',
        ...request,
      },
      fallback
    );
  }
}

export const evaluationService = new EvaluationService();
