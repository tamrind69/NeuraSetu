import { Router, Request, Response } from 'express';
import {
  AdaptiveFeedbackData,
  AssessmentResult,
  TestSubmission,
  AssignmentSubmissionData,
} from '../../src/types';

export const evaluationRouter = Router();

/**
 * POST /api/evaluation
 * Evaluates student answers for checkpoints, assessments, tests, and assignments.
 */
evaluationRouter.post('/', (req: Request, res: Response) => {
  try {
    const { type, payload } = req.body || {};
    const data = payload || req.body;

    // 1. Checkpoint Answer Evaluation
    if (type === 'checkpoint' || data.checkpoint) {
      const selectedOptionId = data.selectedOptionId;
      const checkpoint = data.checkpoint;

      const chosenOption = checkpoint?.options?.find(
        (o: any) => o.id === selectedOptionId
      );
      const isCorrect = chosenOption?.isCorrect ?? false;

      if (isCorrect) {
        const feedback: AdaptiveFeedbackData = {
          correct: true,
          isCorrect: true,
          feedback:
            'Spot On! Exceptional spatial and biochemical intuition on proton accumulation.',
          selectedOptionId,
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
        return res.status(200).json(feedback);
      } else {
        const feedback: AdaptiveFeedbackData = {
          correct: false,
          isCorrect: false,
          misconception:
            'Confusing matrix export with intermembrane space retention or cristae directional orientation.',
          feedback:
            'Close attempt! Re-trace the vector of proton translocation across the cristae.',
          selectedOptionId,
          primaryHeading: 'Close Attempt! Let’s Trace The Molecular Movement',
          explanation:
            'Notice that protons are pumped OUT of the matrix INTO the intermembrane space. If protons accumulated in the matrix, the pH would drop there, which would shut down the Krebs cycle enzymes!',
          socraticBreakdown:
            'The inner mitochondrial membrane acts as an impermeable barrier maintaining an electrical gradient (negative inside matrix, positive outside in intermembrane space).',
          followUpAnalogy:
            'Imagine inflating a bike tire: the pump forces air molecules (protons) into the outer chamber. The pressure builds up outside the pump tube, not inside!',
          masteryPointsEarned: 20,
          recommendedNextAction:
            'Review the membrane orientation diagram on Slide 3 before re-attempting.',
        };
        return res.status(200).json(feedback);
      }
    }

    // 2. Assessment Evaluation
    if (type === 'assessment' || data.questions) {
      const answers = data.answers || {};
      const questions = data.questions || [];

      let correctCount = 0;
      const totalQuestions = questions.length || 3;

      questions.forEach((q: any) => {
        const studentAns = answers[q.id];
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        if (studentAns && correctOpt && studentAns === correctOpt.id) {
          correctCount++;
        }
      });

      const scorePercent = Math.round((correctCount / totalQuestions) * 100);

      const result: AssessmentResult = {
        scorePercent,
        correctCount,
        totalQuestions,
        timeSpentSeconds: data.timeSpentSeconds || 195,
        topicMastery: [
          { topic: 'Glycolysis & Cytosolic Energetics', percentage: 100, status: 'Mastered' },
          {
            topic: 'Citric Acid (Krebs) Cycle',
            percentage: scorePercent > 80 ? 95 : 75,
            status: scorePercent > 80 ? 'Mastered' : 'Proficient',
          },
          {
            topic: 'Electron Transport Chain Complexes',
            percentage: scorePercent > 70 ? 92 : 65,
            status: scorePercent > 70 ? 'Mastered' : 'Needs Review',
          },
          { topic: 'Chemiosmosis & Proton Motive Force', percentage: 90, status: 'Proficient' },
        ],
        aiSummary: `${data.studentName || 'Student'} completed the lesson with an outstanding ${scorePercent}% score! Conceptual grasp of electron transport chain complexes and proton motive force localization was verified through rigorous clinical and biochemical scenarios.`,
        strengths: [
          'Electron donor reduction potentials (NADH vs FADH2)',
          'Proton translocation vectors and membrane stoichiometry',
        ],
        focusAreas:
          scorePercent < 100
            ? ['Review Complex I vs Complex II stoichiometry under high ATP/ADP ratios']
            : [],
      };

      return res.status(200).json(result);
    }

    // 3. Test Evaluation
    if (type === 'test' || data.testItem) {
      const testItem = data.testItem || {};
      const answers = data.answers || {};
      const questions = testItem.questions || [];
      const totalQuestions = questions.length || testItem.questionCount || 20;

      let correctCount = 0;
      questions.forEach((q: any) => {
        const studentAns = answers[q.id];
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        if (studentAns && correctOpt && studentAns === correctOpt.id) {
          correctCount++;
        }
      });

      if (questions.length === 0) {
        correctCount = Math.max(1, Math.round(totalQuestions * 0.9));
      }

      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const incorrectCount = totalQuestions - correctCount;

      const submission: TestSubmission = {
        testId: data.testId || testItem.id,
        completedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        answers,
        flagged: data.flagged || {},
        timeSpentSeconds: data.timeSpentSeconds || 1200,
        score: percentage,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount: 0,
        totalQuestions,
      };

      return res.status(200).json(submission);
    }

    // 4. Assignment Evaluation
    if (type === 'assignment' || data.assignmentItem) {
      const assignmentItem = data.assignmentItem || {};
      const answers = data.answers || {};

      const sub: AssignmentSubmissionData = {
        assignmentId: data.assignmentId || assignmentItem.id,
        submittedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        answers,
        uploadedFileName: data.uploadedFileName,
        uploadedFileSize: data.uploadedFileSize,
        status: 'submitted',
      };

      return res.status(200).json(sub);
    }

    // Fallback generic evaluation result
    res.status(200).json({
      correct: true,
      feedback: 'Response evaluated successfully.',
      explanation: 'Evaluation processed by backend stub.',
    });
  } catch (error) {
    console.error('Error in evaluation handler:', error);
    res.status(500).json({
      error: 'Failed to evaluate submission',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
