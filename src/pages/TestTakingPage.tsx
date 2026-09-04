import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
  Send,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTests, useNavigation } from '../context';
import { Modal, Button } from '../components/ui';

export const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { testsList, activeTestId, submitTest } = useTests();
  const { goToStep } = useNavigation();

  const effectiveTestId = testId || activeTestId;

  // Find active test or default to first test
  const activeTest = useMemo(() => {
    return testsList.find((t) => t.id === effectiveTestId) || testsList[0];
  }, [testsList, effectiveTestId]);

  const questions = activeTest.questions || [];
  const totalQuestions = questions.length;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(activeTest.durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Stats for submission
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const progressPercent = Math.round((answeredCount / (totalQuestions || 1)) * 100);

  const confirmSubmit = () => {
    const timeSpent = activeTest.durationMinutes * 60 - timeLeftSeconds;
    submitTest(activeTest.id, answers, flagged, Math.max(timeSpent, 60));
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">No questions available for this test.</p>
        <button
          onClick={() => goToStep('tests')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Test Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {activeTest.subject}
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs font-semibold text-slate-500">{activeTest.category}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {activeTest.title}
          </h1>
        </div>

        {/* Timer & Submit Header Controls */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold tracking-wider ${
              timeLeftSeconds < 300
                ? 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${timeLeftSeconds < 300 ? 'text-rose-500' : 'text-slate-500'}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Quick Submit Test button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-slate-400 font-normal">({progressPercent}% answered)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex-1">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Test Grid: Left Question Area, Right Navigation Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Box (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Question Header & Flag Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                {currentQuestion.topicTag}
              </span>
            </div>

            {/* Mark for Review Button */}
            <button
              onClick={handleToggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                flagged[currentQuestion.id]
                  ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flag
                className={`w-3.5 h-3.5 ${
                  flagged[currentQuestion.id] ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                }`}
              />
              <span>{flagged[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </h2>
            {currentQuestion.context && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
                {currentQuestion.context}
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select one option:
            </label>
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = answers[currentQuestion.id] === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {letter}
                  </span>
                  <span
                    className={`text-sm leading-relaxed ${
                      isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Pagination & Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              disabled={currentQuestionIndex === 0}
              onClick={handlePrev}
            >
              Previous Question
            </Button>

            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              {answeredCount} of {totalQuestions} answered
            </div>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                iconPosition="right"
                onClick={handleNext}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                icon={<Send className="w-3.5 h-3.5" />}
                iconPosition="right"
                onClick={() => setShowSubmitModal(true)}
              >
                Review & Submit
              </Button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Question Palette</h3>
              <span className="text-xs text-slate-400 font-medium">
                {totalQuestions} total
              </span>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = !!flagged[q.id];
                const isCurrent = currentQuestionIndex === idx;

                let btnStyles = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isCurrent) {
                  btnStyles = 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400 font-bold';
                } else if (isFlagged) {
                  btnStyles = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
                } else if (isAnswered) {
                  btnStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`relative h-10 rounded-xl border text-xs flex items-center justify-center transition-all hover:scale-105 ${btnStyles}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
                  <span>Answered</span>
                </div>
                <span className="font-semibold text-slate-900">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
                  <span>Marked for Review</span>
                </div>
                <span className="font-semibold text-slate-900">{flaggedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200" />
                  <span>Unanswered</span>
                </div>
                <span className="font-semibold text-slate-900">{unansweredCount}</span>
              </div>
            </div>

            {/* Submit Button in Sidebar */}
            <Button
              variant="dark"
              size="md"
              fullWidth
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Entire Test
            </Button>
          </div>

          {/* Guidance Card */}
          <div className="bg-indigo-50/70 rounded-2xl border border-indigo-200/60 p-4 text-xs text-indigo-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Taking Tip</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Flag questions you are uncertain about and review them before finishing. Answers are saved locally as you click.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test?"
        description="Are you sure you want to submit the test?"
        icon={<Send className="w-5 h-5" />}
        footer={
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setShowSubmitModal(false)}
            >
              Keep Working
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={confirmSubmit}
            >
              Yes, Submit Test
            </Button>
          </div>
        }
      >
        {/* Status Breakdown in Modal */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Total Questions:</span>
            <span className="font-bold text-slate-900">{totalQuestions}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Answered:</span>
            <span className="font-bold">{answeredCount}</span>
          </div>
          {unansweredCount > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Unanswered Questions:</span>
              <span>{unansweredCount}</span>
            </div>
          )}
          {flaggedCount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Marked for Review:</span>
              <span className="font-bold">{flaggedCount}</span>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
