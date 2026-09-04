import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentItem, AssignmentSubmissionData } from '../types';
import { mockAssignmentsData } from '../data/testsAndAssignmentsData';
import { useUserProfile } from './UserProfileContext';
import { evaluationService } from '../services';

interface AssignmentsContextType {
  assignmentsList: AssignmentItem[];
  setAssignmentsList: React.Dispatch<React.SetStateAction<AssignmentItem[]>>;
  activeAssignmentId: string | null;
  setActiveAssignmentId: (id: string | null) => void;
  assignmentSubmissions: Record<string, AssignmentSubmissionData>;
  assignmentDrafts: Record<string, Record<string, string>>;
  viewAssignment: (assignmentId: string) => void;
  startAssignment: (assignmentId: string) => void;
  saveAssignmentDraft: (assignmentId: string, answers: Record<string, string>) => void;
  submitAssignment: (
    assignmentId: string,
    answers: Record<string, string>,
    uploadedFileName?: string,
    uploadedFileSize?: string
  ) => void;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addXp } = useUserProfile();
  const navigate = useNavigate();

  const [assignmentsList, setAssignmentsList] = useState<AssignmentItem[]>(mockAssignmentsData);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>('asg-1');

  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, AssignmentSubmissionData>>({
    'asg-5': {
      assignmentId: 'asg-5',
      answers: {
        'task-1':
          'The net equation incorporates 2 molecules of ATP invested in the preparatory phase, yielding 4 molecules of ATP synthesized via substrate-level phosphorylation, for a net gain of 2 ATP and 2 NADH.',
        'task-2': 'opt-a',
      },
      submittedAt: 'Aug 27, 2026 at 4:22 PM',
      status: 'submitted',
    },
    'asg-6': {
      assignmentId: 'asg-6',
      answers: {
        'task-1':
          'Structural stalling and melting of the duplex allows the 3\' mismatch to translocate into the exonuclease catalytic cleft 30 Å away.',
        'task-2':
          'Initial fidelity is ~1 in 10^5; 3\' exonuclease proofreading reduces this to ~1 in 10^7, and post-replicative mismatch repair achieves ~1 in 10^9.',
      },
      submittedAt: 'Aug 19, 2026 at 6:10 PM',
      status: 'submitted',
    },
  });

  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('ai_teacher_assignment_drafts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      'asg-1': {
        'task-1':
          'The inner mitochondrial membrane of cardiac myocytes exhibits a ~3.2-fold higher cristae surface density compared to hepatic cells due to non-stop continuous aerobic ATP demand.',
        'task-2':
          'Using PMF = ΔΨ - 60(ΔpH), the membrane potential provides ~160 mV and the pH gradient (0.8 units) provides ~48 mV, yielding a total driving force of ~208 mV.',
        'task-3': 'opt-a',
      },
    };
  });

  const viewAssignment = (assignmentId: string) => {
    setActiveAssignmentId(assignmentId);
    navigate(`/assignments/${assignmentId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAssignment = (assignmentId: string) => {
    setActiveAssignmentId(assignmentId);
    setAssignmentsList((prev) =>
      prev.map((a) => (a.id === assignmentId && a.status === 'pending' ? { ...a, status: 'in-progress' } : a))
    );
    navigate(`/assignments/${assignmentId}/submit`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAssignmentDraft = (assignmentId: string, answers: Record<string, string>) => {
    setAssignmentDrafts((prev) => {
      const updated = { ...prev, [assignmentId]: answers };
      try {
        localStorage.setItem('ai_teacher_assignment_drafts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const submitAssignment = async (
    assignmentId: string,
    answers: Record<string, string>,
    uploadedFileName?: string,
    uploadedFileSize?: string
  ) => {
    const assignment = assignmentsList.find((a) => a.id === assignmentId);
    if (!assignment) return;

    try {
      const sub = await evaluationService.evaluateAssignmentSubmission({
        assignmentId,
        assignmentItem: assignment,
        answers,
        uploadedFileName,
        uploadedFileSize,
      });

      setAssignmentSubmissions((prev) => ({ ...prev, [assignmentId]: sub }));
      setAssignmentsList((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                status: 'submitted',
                grade: a.grade || {
                  score: 96,
                  maxScore: 100,
                  feedback: 'Outstanding submission! Responses exhibit thorough rigor and understanding.',
                  submittedDate: 'Just now',
                },
              }
            : a
        )
      );
      addXp(75);
    } catch (err) {
      console.error('Error submitting assignment via evaluationService:', err);
    }
  };

  return (
    <AssignmentsContext.Provider
      value={{
        assignmentsList,
        setAssignmentsList,
        activeAssignmentId,
        setActiveAssignmentId,
        assignmentSubmissions,
        assignmentDrafts,
        viewAssignment,
        startAssignment,
        saveAssignmentDraft,
        submitAssignment,
      }}
    >
      {children}
    </AssignmentsContext.Provider>
  );
};

export const useAssignments = () => {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error('useAssignments must be used within an AssignmentsProvider');
  }
  return context;
};
