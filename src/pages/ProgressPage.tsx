import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Lock,
  PlayCircle,
  Flame,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useUserProfile, useNavigation } from '../context';
import { mockProgressRoadmap } from '../data/mockData';

export const ProgressPage: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { goToStep } = useNavigation();

  const subjects = [
    { name: 'AP Biology & Molecular STEM', progress: 94, color: 'bg-emerald-500' },
    { name: 'Organic & General Chemistry', progress: 88, color: 'bg-teal-500' },
    { name: 'AP Calculus & Mathematical Logic', progress: 85, color: 'bg-indigo-500' },
    { name: 'Computer Science & Data Structures', progress: 91, color: 'bg-purple-500' },
  ];

  const badges = [
    { title: 'Mitochondria Master', date: 'Earned Today', icon: '🧬', desc: 'Scored 90%+ on Cellular Energetics' },
    { title: '14-Day Streak Warrior', date: 'Active', icon: '🔥', desc: 'Maintained 14 consecutive study days' },
    { title: 'Socratic Thinker', date: 'Nov 2024', icon: '💡', desc: 'Solved 25 adaptive questions on first try' },
    { title: 'Mastery Scholar', date: 'Oct 2024', icon: '🎓', desc: 'Completed 15 core STEM modules' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Mastery Roadmap & Long-Term Retention</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Curriculum Progress & Learning Journey
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track unit milestones, spaced repetition queues, and competency evolution across your courses.
          </p>
        </div>

        <button
          onClick={() => goToStep('create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <span>Start Next Custom Lesson</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Global Knowledge Level
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">Level 8</span>
            <span className="text-xs text-slate-500 font-semibold">Scholar</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{userProfile.xp} total XP accumulated</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Study Streak
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{userProfile.streakDays}</span>
            <span className="text-xs text-amber-600 font-bold">Days in a row</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Goal: 30 days milestone</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Completed Modules
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{userProfile.completedLessons}</span>
            <span className="text-xs text-slate-500 font-medium">Lessons</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across 3 academic disciplines</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Accuracy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{userProfile.accuracyRate}%</span>
            <span className="text-xs text-emerald-600 font-bold">Mastery tier</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Evaluated on 50+ question items</p>
        </div>
      </div>

      {/* Main Roadmap Tree + Domain Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Unit-by-Unit Interactive Curriculum Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>AP Biology Curriculum Pathway</span>
              </h3>
              <span className="text-xs text-slate-500">Unit 3 Active</span>
            </div>

            <div className="space-y-6">
              {mockProgressRoadmap.map((unit, uIdx) => (
                <div key={unit.unitId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          unit.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : unit.status === 'in-progress'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {uIdx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{unit.unitTitle}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        unit.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : unit.status === 'in-progress'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {unit.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Lessons list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-8">
                    {unit.lessons.map((les) => (
                      <div
                        key={les.id}
                        className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between gap-2 ${
                          les.status === 'current'
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/20'
                            : les.status === 'completed'
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : les.status === 'next'
                            ? 'bg-white border-dashed border-indigo-300'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900 line-clamp-1">{les.title}</p>
                          <span className="text-[10px] text-slate-500">
                            {les.score !== null ? `Score: ${les.score}%` : les.status === 'next' ? 'Up Next' : 'Locked'}
                          </span>
                        </div>

                        {les.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : les.status === 'current' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white shrink-0">
                            Active
                          </span>
                        ) : les.status === 'next' ? (
                          <button
                            onClick={() => goToStep('create')}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded shrink-0"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Subject Mastery & Badges */}
        <div className="space-y-6">
          {/* Subject Mastery Radial / Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Subject Competency Balance</span>
            </h3>

            <div className="space-y-3">
              {subjects.map((sub) => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">{sub.name}</span>
                    <span className="font-bold text-slate-900">{sub.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${sub.color} h-2 rounded-full`} style={{ width: `${sub.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earned Badges Collection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Earned Credentials</span>
              </h3>
              <span className="text-xs text-slate-400">4 / 12</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-center flex flex-col items-center"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-xs font-bold text-slate-900 block line-clamp-1">{b.title}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
