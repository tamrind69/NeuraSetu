import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Flag,
  HelpCircle,
  Sparkles,
  MoveUp,
  MoveDown,
  ChevronRight,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';

export const AssessmentPage: React.FC = () => {
  const {
    currentLesson,
    assessmentAnswers,
    setAssessmentAnswer,
    submitAssessment,
  } = useLesson();
  const { goToStep } = useNavigation();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  const questions = currentLesson.assessmentQuestions;
  const currentQ = questions[currentIdx];

  const handleSelectOption = (optId: string) => {
    setAssessmentAnswer(currentQ.id, optId);
  };

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // For sequencing questions: move items up/down
  const moveSequenceItem = (fromIdx: number, toIdx: number) => {
    const currentOrder = (assessmentAnswers[currentQ.id] as string[]) ||
      currentQ.sequenceItems?.map((i) => i.id) || [];
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setAssessmentAnswer(currentQ.id, newOrder);
  };

  const handleSubmit = () => {
    // Fire festive confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    submitAssessment();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
              Final Lesson Mastery Assessment
            </span>
            <span className="text-xs text-slate-500">4 Core Evaluative Questions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentLesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Untimed • Mastery Focus</span>
          </div>
        </div>
      </div>

      {/* Question Stepper Indicator */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIdx;
            const isAnswered = assessmentAnswers[q.id] !== undefined && assessmentAnswers[q.id] !== '';
            const isFlag = flagged[idx];

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all relative ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
                {isFlag && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFlag(currentIdx)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              flagged[currentIdx]
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagged[currentIdx] ? 'Flagged' : 'Flag Question'}</span>
          </button>
        </div>
      </div>

      {/* Main Question Environment */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Topic Tag & Index */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {currentQ.topicTag}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Clinical Snippet Context (if any) */}
        {currentQ.contextSnippet && (
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/70 text-xs text-purple-900 font-medium leading-relaxed">
            {currentQ.contextSnippet}
          </div>
        )}

        {/* Prompt */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
          {currentQ.prompt}
        </h2>

        {/* Question Type 1 & 2: Multiple Choice or Scenario */}
        {(currentQ.type === 'multiple-choice' || currentQ.type === 'scenario') && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt, oIdx) => {
              const letters = ['A', 'B', 'C', 'D'];
              const isSelected = assessmentAnswers[currentQ.id] === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      {letters[oIdx]}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isSelected ? 'text-indigo-950' : 'text-slate-700'
                      }`}
                    >
                      {opt.text}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Question Type 3: Sequencing (Order items) */}
        {currentQ.type === 'sequencing' && currentQ.sequenceItems && (
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-medium">
              Use the arrows to organize the chronological biochemical sequence:
            </span>

            {((assessmentAnswers[currentQ.id] as string[]) || currentQ.sequenceItems.map((s) => s.id)).map(
              (itemId, i) => {
                const item = currentQ.sequenceItems?.find((s) => s.id === itemId);
                if (!item) return null;

                return (
                  <div
                    key={itemId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveSequenceItem(i, i - 1)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === currentQ.sequenceItems!.length - 1}
                        onClick={() => moveSequenceItem(i, i + 1)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Navigation Controls Row */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Question</span>
          </button>

          <div className="flex items-center gap-3">
            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
