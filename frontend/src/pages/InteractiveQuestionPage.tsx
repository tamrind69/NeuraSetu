import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  Video,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';

export const InteractiveQuestionPage: React.FC = () => {
  const {
    currentLesson,
    activeTeacher,
    submitCheckpointAnswer,
  } = useLesson();
  const { goToStep } = useNavigation();

  const [selectedOption, setSelectedOption] = useState<string>('opt-b');
  const [confidence, setConfidence] = useState<string>('confident');
  const [showHint, setShowHint] = useState<boolean>(false);

  const question = currentLesson.checkpoint;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    submitCheckpointAnswer(selectedOption, confidence);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Context */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              Interactive Concept Checkpoint
            </span>
            <span className="text-xs text-slate-500">Module 3 of 4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {question.title}
          </h1>
        </div>

        <button
          onClick={() => goToStep('classroom')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Video className="w-4 h-4 text-indigo-600" />
          <span>Back to Video</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Mentor Prompt Introduction */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
          <img
            src={activeTeacher.avatar}
            alt={activeTeacher.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-indigo-900 block">
              {activeTeacher.name} asks:
            </span>
            <p className="text-sm text-indigo-950 font-medium leading-relaxed mt-0.5">
              "{question.prompt}"
            </p>
          </div>
        </div>

        {/* Options List */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2.5">
            {question.options.map((option, idx) => {
              const letters = ['A', 'B', 'C', 'D'];
              const isSelected = selectedOption === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      {letters[idx]}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold transition-colors ${
                        isSelected ? 'text-indigo-950' : 'text-slate-700'
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confidence Meter */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              How confident are you? (Helps AI calibrate future hints)
            </span>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { id: 'guessing', label: 'Exploring / Guessing' },
                { id: 'confident', label: 'Fairly Confident' },
                { id: 'certain', label: '100% Certain' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConfidence(c.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                    confidence === c.id
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Socratic Hint Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 p-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{showHint ? 'Hide Socratic Hint' : 'Stuck? Request a Socratic Hint'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHint ? 'rotate-180' : ''}`} />
            </button>

            {showHint && (
              <div className="mt-2 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1">
                  💡 Dr. Evelyn's Hint:
                </span>
                <p>{question.socraticHint}</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep('classroom')}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Replay Lecture Clip</span>
            </button>

            <button
              type="submit"
              disabled={!selectedOption}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all hover:translate-x-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Submit & Check Feedback</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
