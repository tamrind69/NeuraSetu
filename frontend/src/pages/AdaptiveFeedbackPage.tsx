import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  HelpCircle,
  Volume2,
  Video,
  Lightbulb,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';
import { ttsService } from '../services';

export const AdaptiveFeedbackPage: React.FC = () => {
  const {
    adaptiveFeedback,
    activeTeacher,
    resetCheckpoint,
  } = useLesson();
  const { goToStep } = useNavigation();

  const [simplified, setSimplified] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handlePlayVoice = async () => {
    setIsPlayingVoice(true);
    try {
      const textToSpeak = simplified
        ? 'Think of the mitochondria as a two-walled house. Protons get squeezed into the narrow gap between the outer and inner walls.'
        : (adaptiveFeedback?.socraticBreakdown || 'By establishing this steep proton gradient across the inner membrane, the cell builds an electrochemical battery.');
      await ttsService.synthesizeSpeech({
        text: textToSpeak,
        personaId: activeTeacher.id,
      });
      setTimeout(() => setIsPlayingVoice(false), 2000);
    } catch {
      setIsPlayingVoice(false);
    }
  };

  const feedback = adaptiveFeedback || {
    isCorrect: true,
    selectedOptionId: 'opt-b',
    primaryHeading: 'Spot On! Exceptional Spatial & Biochemical Intuition',
    explanation:
      'Complexes I, III, and IV actively pump protons (H+) from the matrix across the inner mitochondrial membrane into the confined intermembrane space.',
    socraticBreakdown:
      'By establishing this steep proton gradient across the inner membrane into the intermembrane space, the cell builds an electrochemical battery (~140mV) ready to discharge through the ATP synthase rotary engine.',
    followUpAnalogy:
      'Think of the intermembrane space as a high-pressure reservoir behind a hydroelectric dam. As the protons flow through the narrow ATP Synthase gate, their kinetic energy rotates the catalytic head to generate ATP!',
    masteryPointsEarned: 50,
    recommendedNextAction: 'Proceed with high confidence to the comprehensive assessment.',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                feedback.isCorrect
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              {feedback.isCorrect ? 'Correct Answer Verified' : 'Conceptual Review Needed'}
            </span>
            <span className="text-xs text-slate-500">Adaptive Feedback Loop</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {feedback.primaryHeading}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>+{feedback.masteryPointsEarned} XP</span>
          </div>
        </div>
      </div>

      {/* Main Feedback Content Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Mentor Voice Note */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <img
            src={activeTeacher.avatar}
            alt={activeTeacher.name}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{activeTeacher.name}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md">
                  Adaptive Explanation
                </span>
              </div>
              <button
                type="button"
                onClick={handlePlayVoice}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Listen with Teacher Voice (TTS Service)"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoice ? 'animate-pulse text-indigo-600' : ''}`} />
                <span>{isPlayingVoice ? 'Speaking...' : 'Listen'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {simplified
                ? 'Think of the mitochondria as a two-walled house. Protons get squeezed into the narrow gap between the outer and inner walls. Because it is so crowded, they rush back inside through a spinning doorway (ATP Synthase) to power up the cell!'
                : feedback.socraticBreakdown}
            </p>
          </div>
        </div>

        {/* Real World Analogy Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-teal-50/70 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Macroscopic Analogy: The Hydroelectric Reservoir</span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-950/80 leading-relaxed">
            {feedback.followUpAnalogy}
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSimplified(!simplified)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>{simplified ? 'Show Technical Socratic View' : 'Explain with Simpler Everyday Language'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetCheckpoint();
              goToStep('interactive-question');
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Question Again</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => goToStep('classroom')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
          >
            <Video className="w-4 h-4 text-slate-500" />
            <span>Return to Classroom Video</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep('assessment')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm shadow-md shadow-teal-500/25 transition-all hover:translate-x-0.5"
          >
            <span>Proceed to Comprehensive Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
