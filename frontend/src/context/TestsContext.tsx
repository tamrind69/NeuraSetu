import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestItem, TestSubmission } from '../types';
import { mockTestsData } from '../data/testsAndAssignmentsData';
import { useUserProfile } from './UserProfileContext';
import { evaluationService } from '../services';

interface TestsContextType {
  testsList: TestItem[];
  setTestsList: React.Dispatch<React.SetStateAction<TestItem[]>>;
  activeTestId: string | null;
  setActiveTestId: (id: string | null) => void;
  testSubmissions: Record<string, TestSubmission>;
  startTest: (testId: string) => void;
  continueTest: (testId: string) => void;
  viewTestResult: (testId: string) => void;
  submitTest: (
    testId: string,
    answers: Record<string, string>,
    flagged: Record<string, boolean>,
    timeSpentSeconds: number
  ) => void;
  retakeTest: (testId: string) => void;
}

const TestsContext = createContext<TestsContextType | undefined>(undefined);

export const TestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addXp, incrementCompletedLessons } = useUserProfile();
  const navigate = useNavigate();

  const [testsList, setTestsList] = useState<TestItem[]>(mockTestsData);
  const [activeTestId, setActiveTestId] = useState<string | null>('test-1');

  const [testSubmissions, setTestSubmissions] = useState<Record<string, TestSubmission>>({
    'test-1': {
      testId: 'test-1',
      answers: {
        q1: 'opt-b',
        q2: 'opt-b',
        q3: 'opt-a',
        q4: 'opt-b',
        q5: 'opt-b',
      },
      flagged: {},
      timeSpentSeconds: 1305,
      score: 18,
      percentage: 90,
      correctCount: 18,
      incorrectCount: 2,
      unansweredCount: 0,
      completedAt: 'Yesterday at 3:15 PM',
    },
    'test-4': {
      testId: 'test-4',
      answers: {
        q1: 'opt-a',
        q2: 'opt-a',
      },
      flagged: {},
      timeSpentSeconds: 1940,
      score: 24,
      percentage: 96,
      correctCount: 24,
      incorrectCount: 1,
      unansweredCount: 0,
      completedAt: '3 days ago',
    },
  });

  const startTest = (testId: string) => {
    setActiveTestId(testId);
    setTestsList((prev) =>
      prev.map((t) => (t.id === testId && t.status === 'not-started' ? { ...t, status: 'in-progress' } : t))
    );
    navigate(`/tests/${testId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const continueTest = (testId: string) => {
    setActiveTestId(testId);
    navigate(`/tests/${testId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewTestResult = (testId: string) => {
    setActiveTestId(testId);
    navigate(`/tests/${testId}/result`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retakeTest = (testId: string) => {
    setActiveTestId(testId);
    navigate(`/tests/${testId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitTest = async (
    testId: string,
    answers: Record<string, string>,
    flagged: Record<string, boolean>,
    timeSpentSeconds: number
  ) => {
    const test = testsList.find((t) => t.id === testId);
    if (!test) return;

    try {
      const submission = await evaluationService.evaluateTestSubmission({
        testId,
        testItem: test,
        answers,
        flagged,
        timeSpentSeconds,
      });

      setTestSubmissions((prev) => ({ ...prev, [testId]: submission }));
      setTestsList((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: 'completed',
                score: submission.percentage,
                correctCount: submission.correctCount,
                totalQuestions: submission.totalQuestions || t.questionCount,
                timeSpentSeconds,
                lastTakenDate: 'Just now',
              }
            : t
        )
      );

      addXp(50);
      incrementCompletedLessons();

      setActiveTestId(testId);
      navigate(`/tests/${testId}/result`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting test via evaluationService:', err);
    }
  };

  return (
    <TestsContext.Provider
      value={{
        testsList,
        setTestsList,
        activeTestId,
        setActiveTestId,
        testSubmissions,
        startTest,
        continueTest,
        viewTestResult,
        submitTest,
        retakeTest,
      }}
    >
      {children}
    </TestsContext.Provider>
  );
};

export const useTests = () => {
  const context = useContext(TestsContext);
  if (!context) {
    throw new Error('useTests must be used within a TestsProvider');
  }
  return context;
};
