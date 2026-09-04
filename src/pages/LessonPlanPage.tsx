import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Video,
  ListChecks,
  HelpCircle,
  Layers,
  GraduationCap,
  Volume2,
  ChevronDown,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';

export const LessonPlanPage: React.FC = () => {
  const { currentLesson, activeTeacher, personalization } = useLesson();
  const { goToStep } = useNavigation();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Lesson Plan Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentLesson.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Subject: <span className="font-semibold text-slate-700">{currentLesson.subject}</span> • Grade: <span className="font-semibold text-slate-700">{currentLesson.grade}</span>
          </p>
        </div>

        <button
          onClick={() => goToStep('classroom')}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
        >
          <Video className="w-4 h-4" />
          <span>Launch AI Classroom</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Lecture Duration
          </span>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xl">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>{currentLesson.estimatedTotalMinutes} Minutes</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Curriculum Modules
          </span>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xl">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>{currentLesson.modules.length} Segments</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Interactive Checkpoints
          </span>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xl">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>1 Live Checkpoint</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Instructor Persona
          </span>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm truncate">
            <img
              src={activeTeacher.avatar}
              alt={activeTeacher.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="truncate">{activeTeacher.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Timeline Structure (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Structured Curriculum Breakdown</span>
            </h3>

            <div className="space-y-4">
              {currentLesson.modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className={`p-5 rounded-xl border transition-all ${
                    mod.hasCheckpoint
                      ? 'bg-amber-50/30 border-amber-200/80 ring-1 ring-amber-400/20'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {mod.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {mod.hasCheckpoint && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/60 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          Interactive Checkpoint
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                        {mod.durationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">{mod.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Key Takeaways:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {mod.keyPoints.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Vocabulary Dictionary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Essential Conceptual Vocabulary</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentLesson.vocabulary.map((vocab) => (
                <div
                  key={vocab.term}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-700">{vocab.term}</span>
                    <span className="text-[10px] text-slate-400">Term</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{vocab.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Learning Objectives & Verification (1 col) */}
        <div className="space-y-6">
          {/* Objectives Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-indigo-600" />
              <span>Mastery Objectives</span>
            </h3>

            <ul className="space-y-3">
              {currentLesson.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pedagogy Settings Review */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3 text-xs">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Tuned Pedagogical Settings
            </span>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Instructor:</span>
                <span className="font-semibold text-slate-800">{activeTeacher.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Learning Style:</span>
                <span className="font-semibold text-slate-800 capitalize">{personalization.learningStyle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Pace:</span>
                <span className="font-semibold text-slate-800 capitalize">{personalization.pace}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Socratic Feedback:</span>
                <span className="font-semibold text-emerald-600">Enabled</span>
              </div>
            </div>

            <button
              onClick={() => goToStep('personalization')}
              className="w-full mt-2 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
            >
              Adjust Settings
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep('personalization')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Personalization</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('classroom')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:translate-x-0.5"
        >
          <span>Enter AI Teacher Classroom</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
