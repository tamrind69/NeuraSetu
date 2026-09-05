import React from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Volume2,
  Brain,
  Eye,
  BookOpen,
  Zap,
  GraduationCap,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';
import { teacherPersonas } from '../data/mockData';
import { TeacherPersonaId, LearningStyle, Pace, Difficulty } from '../types';

export const PersonalizationPage: React.FC = () => {
  const {
    personalization,
    setPersonalization,
    isGeneratingPlan,
    generateLessonPlan,
  } = useLesson();
  const { goToStep } = useNavigation();

  const handleTeacherSelect = (id: TeacherPersonaId) => {
    setPersonalization((prev) => ({ ...prev, personaId: id }));
  };

  const handleStyleSelect = (style: LearningStyle) => {
    setPersonalization((prev) => ({ ...prev, learningStyle: style }));
  };

  const handlePaceSelect = (pace: Pace) => {
    setPersonalization((prev) => ({ ...prev, pace }));
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setPersonalization((prev) => ({ ...prev, difficulty: diff }));
  };

  const toggleCheckpoint = () => {
    setPersonalization((prev) => ({
      ...prev,
      pauseForCheckpoints: !prev.pauseForCheckpoints,
    }));
  };

  const toggleSocratic = () => {
    setPersonalization((prev) => ({
      ...prev,
      socraticHintsEnabled: !prev.socraticHintsEnabled,
    }));
  };

  const toggleAnalogies = () => {
    setPersonalization((prev) => ({
      ...prev,
      includeAnalogies: !prev.includeAnalogies,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <span>Step 3 of 4</span>
          <span>•</span>
          <span>Pedagogy & Mentor Personalization</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Customize Your AI Teacher
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Fine-tune the teaching style, explanation depth, and voice persona. The AI adapts lecture pacing, diagrams, and question prompts to your learning profile.
        </p>
      </div>

      {/* 1. Teacher Persona Selection */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Select Your AI Instructor
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teacherPersonas.map((teacher) => {
            const isSelected = personalization.personaId === teacher.id;
            return (
              <div
                key={teacher.id}
                onClick={() => handleTeacherSelect(teacher.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{teacher.name}</h3>
                      <p className="text-xs text-indigo-600 font-medium">{teacher.title}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{teacher.toneDescription}</p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 italic">
                    {teacher.sampleVoiceQuote}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md block text-center">
                    {teacher.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Learning Style & Cognitive Approach */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          <span>Cognitive Learning Preferences</span>
        </h3>

        {/* Learning Style Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Primary Learning Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'visual' as LearningStyle,
                title: 'Visual & Spatial',
                desc: 'Animated pathways, flowcharts & 3D diagrams',
                icon: Eye,
              },
              {
                id: 'conceptual' as LearningStyle,
                title: 'First Principles',
                desc: 'Deep reasoning, why-before-how, fundamental laws',
                icon: Brain,
              },
              {
                id: 'storytelling' as LearningStyle,
                title: 'Narrative & Analogy',
                desc: 'Connecting biological machinery to real machines',
                icon: BookOpen,
              },
              {
                id: 'problem-solving' as LearningStyle,
                title: 'Challenge & Drill',
                desc: 'Frequent question prompts and exam problems',
                icon: Zap,
              },
            ].map((st) => {
              const Icon = st.icon;
              const isSelected = personalization.learningStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStyleSelect(st.id)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-400/20 text-indigo-900 font-semibold'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${
                      isSelected ? 'text-indigo-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="block text-xs font-bold">{st.title}</span>
                  <span className="block text-[11px] text-slate-500 mt-1">{st.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pacing & Difficulty Sliders/Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Pace */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Teaching Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'steady' as Pace, label: 'Steady & Methodical' },
                { id: 'fast-track' as Pace, label: 'Fast-Track' },
                { id: 'deep-dive' as Pace, label: 'Deep Dive' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePaceSelect(p.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                    personalization.pace === p.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Question Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'foundational' as Difficulty, label: 'Foundational' },
                { id: 'standard' as Difficulty, label: 'AP / Standard' },
                { id: 'advanced' as Difficulty, label: 'Olympiad / Honors' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDifficultySelect(d.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                    personalization.difficulty === d.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pedagogical Interventions */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Adaptive Interactivity Settings
          </label>
          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={personalization.pauseForCheckpoints}
                onChange={toggleCheckpoint}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Automatic Concept Checkpoints
                </span>
                <span className="text-slate-500">
                  Pause the video at critical moments to verify active retention before proceeding.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={personalization.socraticHintsEnabled}
                onChange={toggleSocratic}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Socratic Feedback Loops
                </span>
                <span className="text-slate-500">
                  Rather than just revealing the answer on mistakes, guide with probing conceptual hints.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={personalization.includeAnalogies}
                onChange={toggleAnalogies}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Real-World Physical Analogies
                </span>
                <span className="text-slate-500">
                  Illustrate microscopic chemical gradients using macro concepts like dams, turbines, and batteries.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep('upload-topic')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Upload / Topic</span>
        </button>

        <button
          type="button"
          disabled={isGeneratingPlan}
          onClick={generateLessonPlan}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          {isGeneratingPlan ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Custom Lesson Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Lesson Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
