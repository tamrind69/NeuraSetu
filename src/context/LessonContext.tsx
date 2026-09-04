import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  PersonalizationConfig,
  LessonData,
  AdaptiveFeedbackData,
  AssessmentResult,
  TopicPreset,
  ChatMessage,
  UploadedFileState,
} from '../types';
import {
  teacherPersonas,
  topicPresets,
  defaultLesson,
  mockDefaultReport,
} from '../data/mockData';
import { useUserProfile } from './UserProfileContext';
import { useNavigation } from './NavigationContext';
import {
  lessonPlanService,
  ragService,
  chatService,
  evaluationService,
} from '../services';
import { useAsyncAction, AsyncStatus } from '../hooks';

export type { ChatMessage, UploadedFileState };

interface LessonContextType {
  // Creation Flow State
  creationMode: 'topic' | 'upload' | 'curated';
  setCreationMode: (mode: 'topic' | 'upload' | 'curated') => void;
  selectedPreset: TopicPreset | null;
  selectPreset: (preset: TopicPreset | null) => void;
  topicInput: string;
  setTopicInput: (val: string) => void;
  subjectInput: string;
  setSubjectInput: (val: string) => void;
  uploadedFile: UploadedFileState | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<UploadedFileState | null>>;
  simulateFileUpload: (file: File) => void;

  // Personalization
  personalization: PersonalizationConfig;
  setPersonalization: React.Dispatch<React.SetStateAction<PersonalizationConfig>>;
  activeTeacher: typeof teacherPersonas[0];

  // Lesson
  currentLesson: LessonData;
  setCurrentLesson: React.Dispatch<React.SetStateAction<LessonData>>;
  isGeneratingPlan: boolean;
  planGenerationStatus?: AsyncStatus;
  generateLessonPlan: () => Promise<void>;

  // Classroom State
  activeModuleIndex: number;
  setActiveModuleIndex: (idx: number) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  playbackSpeed: number;
  setPlaybackSpeed: (spd: number) => void;
  showCaptions: boolean;
  setShowCaptions: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;

  // Interactive Question & Adaptive Feedback
  checkpointOpen: boolean;
  setCheckpointOpen: (open: boolean) => void;
  selectedCheckpointOption: string | null;
  submitCheckpointAnswer: (optionId: string, confidence: string) => void;
  adaptiveFeedback: AdaptiveFeedbackData | null;
  resetCheckpoint: () => void;

  // Classroom Live Chat
  chatMessages: ChatMessage[];
  sendStudentQuestion: (text: string) => void;

  // Assessment
  assessmentAnswers: Record<string, any>;
  setAssessmentAnswer: (questionId: string, answer: any) => void;
  assessmentResult: AssessmentResult | null;
  submitAssessment: () => void;
  resetAssessment: () => void;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

const DRAFT_STORAGE_KEY = 'ai_teacher_create_lesson_draft';

const getInitialDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return null;
};

export const LessonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, addXp, incrementCompletedLessons, updateAccuracyRate } = useUserProfile();
  const { goToStep } = useNavigation();

  const initialDraft = getInitialDraft();

  // Creation flow
  const [creationMode, setCreationMode] = useState<'topic' | 'upload' | 'curated'>(
    initialDraft?.creationMode || 'topic'
  );
  const [selectedPreset, setSelectedPreset] = useState<TopicPreset | null>(topicPresets[0]);
  const [topicInput, setTopicInput] = useState<string>(
    initialDraft?.topicTitle || 'Cellular Respiration & ATP Synthesis'
  );
  const [subjectInput, setSubjectInput] = useState<string>(
    initialDraft?.subject || 'AP Biology'
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);

  // Personalization
  const [personalization, setPersonalization] = useState<PersonalizationConfig>({
    personaId: 'evelyn',
    learningStyle: 'visual',
    pace: 'steady',
    difficulty: 'standard',
    pauseForCheckpoints: true,
    socraticHintsEnabled: true,
    includeAnalogies: true,
  });

  const activeTeacher = useMemo(() => {
    return (
      teacherPersonas.find((p) => p.id === personalization.personaId) ||
      teacherPersonas[0]
    );
  }, [personalization.personaId]);

  // Lesson
  const [currentLesson, setCurrentLesson] = useState<LessonData>(defaultLesson);

  // Classroom State
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(2);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(725);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Interactive Question & Feedback
  const [checkpointOpen, setCheckpointOpen] = useState<boolean>(false);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<string | null>(null);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<AdaptiveFeedbackData | null>(null);

  // Live Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'teacher',
      senderName: 'Dr. Evelyn Vance',
      avatar: teacherPersonas[0].avatar,
      text: "Welcome to class! We're examining the inner mitochondrial membrane where Complexes I-IV pump protons. Notice how this creates a high H+ concentration gradient in the intermembrane space.",
      timestamp: '10:02 AM',
    },
    {
      id: 'm2',
      sender: 'student',
      senderName: 'Alex Chen',
      avatar: userProfile.avatar,
      text: 'Why does Complex II not pump any protons across like Complex I does?',
      timestamp: '10:04 AM',
    },
    {
      id: 'm3',
      sender: 'teacher',
      senderName: 'Dr. Evelyn Vance',
      avatar: teacherPersonas[0].avatar,
      text: "Superb observation, Alex! Complex II (succinate dehydrogenase) has a lower free-energy drop when oxidizing FADH2—there simply isn't enough thermodynamic potential to power the conformational shift required for proton translocation.",
      timestamp: '10:05 AM',
    },
  ]);

  // Assessment
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({
    'q-01': 'b',
    'q-02': 'b',
    'q-03': 'b',
    'q-04': ['seq-1', 'seq-2', 'seq-3', 'seq-4', 'seq-5'],
  });
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(mockDefaultReport);

  const selectPreset = (preset: TopicPreset | null) => {
    setSelectedPreset(preset);
    if (preset) {
      setTopicInput(preset.title);
      setSubjectInput(preset.subject);
    }
  };

  const simulateFileUpload = async (file: File) => {
    setUploadedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type || 'application/pdf',
      uploadProgress: 15,
      status: 'uploading',
      extractedTopics: [],
    });

    try {
      const response = await ragService.uploadDocument(file, (progress) => {
        setUploadedFile((prev) =>
          prev
            ? {
                ...prev,
                uploadProgress: progress,
                status: progress < 100 ? 'parsing' : 'ready',
              }
            : null
        );
      });

      setUploadedFile({
        name: response.filename,
        size: response.fileSize,
        type: file.type || 'application/pdf',
        uploadProgress: 100,
        status: 'ready',
        extractedTopics: response.extractedTopics,
      });
    } catch (err) {
      console.error('File upload error via ragService:', err);
      setUploadedFile((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  };

  // 1. Lesson Plan Generation Action
  const {
    execute: executeGeneratePlan,
    isLoading: isGeneratingPlan,
    status: planGenerationStatus,
  } = useAsyncAction(
    async () => {
      return await lessonPlanService.generateLessonPlan({
        topicTitle: topicInput,
        subject: subjectInput,
        gradeLevel: userProfile.gradeLevel,
        personalization,
        sourceType: creationMode === 'upload' ? 'document' : 'topic',
      });
    },
    {
      onSuccess: (generated) => {
        setCurrentLesson(generated);
        goToStep('lesson-plan');
      },
      onError: (err) => {
        console.error('Failed to generate lesson plan via lessonPlanService:', err);
        goToStep('lesson-plan');
      },
    }
  );

  const generateLessonPlan = async () => {
    await executeGeneratePlan();
  };

  // 2. Checkpoint Answer Evaluation Action
  const {
    execute: executeCheckpointEvaluation,
  } = useAsyncAction(
    async (optionId: string, confidence: string) => {
      setSelectedCheckpointOption(optionId);
      return await evaluationService.evaluateCheckpointAnswer({
        questionId: currentLesson.checkpoint.id,
        selectedOptionId: optionId,
        confidence,
        checkpoint: currentLesson.checkpoint,
        personaId: personalization.personaId,
      });
    },
    {
      onSuccess: (feedback) => {
        setAdaptiveFeedback(feedback);
        if (feedback.masteryPointsEarned) {
          addXp(feedback.masteryPointsEarned);
        }
        goToStep('adaptive-feedback');
      },
      onError: (err) => {
        console.error('Error evaluating checkpoint answer:', err);
        goToStep('adaptive-feedback');
      },
    }
  );

  const submitCheckpointAnswer = async (optionId: string, confidence: string) => {
    await executeCheckpointEvaluation(optionId, confidence);
  };

  const resetCheckpoint = () => {
    setSelectedCheckpointOption(null);
    setAdaptiveFeedback(null);
  };

  const sendStudentQuestion = async (text: string) => {
    if (!text.trim()) return;
    const studentMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      senderName: userProfile.name,
      avatar: userProfile.avatar,
      text: text.trim(),
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, studentMsg]);

    try {
      const teacherReply = await chatService.sendMessage({
        lessonId: currentLesson.id,
        studentName: userProfile.name,
        studentAvatar: userProfile.avatar,
        questionText: text,
        personaId: personalization.personaId,
        activeModuleIndex,
        activeSlideTitle: currentLesson.slides[activeSlideIndex]?.title,
        currentLessonTopic: currentLesson.title,
      });
      setChatMessages((prev) => [...prev, teacherReply]);
    } catch (err) {
      console.error('Error sending message via chatService:', err);
    }
  };

  const setAssessmentAnswer = (questionId: string, answer: any) => {
    setAssessmentAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // 3. Assessment Evaluation Action
  const {
    execute: executeAssessmentEvaluation,
  } = useAsyncAction(
    async () => {
      return await evaluationService.evaluateAssessment({
        answers: assessmentAnswers,
        questions: currentLesson.assessmentQuestions,
        studentName: userProfile.name,
        lessonTopic: currentLesson.title,
      });
    },
    {
      onSuccess: (result) => {
        setAssessmentResult(result);
        addXp(150);
        incrementCompletedLessons();
        updateAccuracyRate(result.scorePercent);
        goToStep('report');
      },
      onError: (err) => {
        console.error('Error submitting assessment via evaluationService:', err);
        goToStep('report');
      },
    }
  );

  const submitAssessment = async () => {
    await executeAssessmentEvaluation();
  };

  const resetAssessment = () => {
    setAssessmentAnswers({
      'q-01': '',
      'q-02': '',
      'q-03': '',
      'q-04': ['seq-1', 'seq-2', 'seq-3', 'seq-4', 'seq-5'],
    });
  };

  return (
    <LessonContext.Provider
      value={{
        creationMode,
        setCreationMode,
        selectedPreset,
        selectPreset,
        topicInput,
        setTopicInput,
        subjectInput,
        setSubjectInput,
        uploadedFile,
        setUploadedFile,
        simulateFileUpload,
        personalization,
        setPersonalization,
        activeTeacher,
        currentLesson,
        setCurrentLesson,
        isGeneratingPlan,
        planGenerationStatus,
        generateLessonPlan,
        activeModuleIndex,
        setActiveModuleIndex,
        activeSlideIndex,
        setActiveSlideIndex,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        playbackSpeed,
        setPlaybackSpeed,
        showCaptions,
        setShowCaptions,
        isMuted,
        setIsMuted,
        checkpointOpen,
        setCheckpointOpen,
        selectedCheckpointOption,
        submitCheckpointAnswer,
        adaptiveFeedback,
        resetCheckpoint,
        chatMessages,
        sendStudentQuestion,
        assessmentAnswers,
        setAssessmentAnswer,
        assessmentResult,
        submitAssessment,
        resetAssessment,
      }}
    >
      {children}
    </LessonContext.Provider>
  );
};

export const useLesson = () => {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLesson must be used within a LessonProvider');
  }
  return context;
};
