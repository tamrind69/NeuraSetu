import React from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Award,
  ArrowRight,
  BookOpen,
  PlayCircle,
  PlusCircle,
  CheckCircle,
  BarChart,
  Zap,
  Target,
  BrainCircuit,
  GraduationCap,
  FileCheck,
  CheckSquare,
} from 'lucide-react';
import { useUserProfile, useNavigation, useLesson } from '../context';
import { topicPresets } from '../data/mockData';
import { HeroBanner, MetricCard, Button, Badge, Card } from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { goToStep } = useNavigation();
  const { selectPreset, currentLesson, activeTeacher } = useLesson();

  const handleStartPreset = (preset: typeof topicPresets[0]) => {
    selectPreset(preset);
    goToStep('upload-topic');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <HeroBanner
        tagText="Personalized AI Curriculum"
        tagIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
        title={<>Welcome back, {userProfile.name}! 👋</>}
        description={
          <>
            Your personalized lesson on <span className="font-semibold text-teal-300">{currentLesson.title}</span> is ready for you. Dr. Evelyn has prepared an interactive Socratic checkpoint on the Electron Transport Chain.
          </>
        }
        actions={
          <>
            <Button
              variant="gradient"
              icon={<PlayCircle className="w-4 h-4" />}
              onClick={() => goToStep('classroom')}
              className="from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 shadow-teal-500/25 py-3 px-5"
            >
              Resume Active Lesson
            </Button>
            <Button
              variant="glass"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => goToStep('create')}
              className="py-3 px-4"
            >
              New Lesson
            </Button>
          </>
        }
      />

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Learning Streak"
          value={userProfile.streakDays}
          badge={<span className="text-xs text-emerald-600 font-semibold flex items-center">+1 day today 🔥</span>}
          description="Consistent daily learning habit"
          icon={Flame}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          label="Concept Mastery"
          value={userProfile.accuracyRate}
          valueUnit="%"
          badge={<span className="text-xs text-emerald-600 font-semibold">+3% this week</span>}
          description="Based on 48 adaptive checkpoints"
          icon={Target}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />

        <MetricCard
          label="Lessons Completed"
          value={userProfile.completedLessons}
          badge={<span className="text-xs text-slate-500 font-medium">of 24 in Unit 3</span>}
          description="Top 5% in AP Biology cohort"
          icon={CheckCircle}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />

        <MetricCard
          label="Total Study Time"
          value={userProfile.studyHours}
          valueUnit="h"
          badge={<span className="text-xs text-purple-600 font-semibold">2,840 XP earned</span>}
          description="Average 35 min / session"
          icon={Clock}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content: Continue Learning Hero & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Lesson In Progress (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span>In-Progress Classroom</span>
            </h2>
            <button
              onClick={() => goToStep('progress')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Full Syllabus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Lesson Card */}
          <Card className="p-6 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{currentLesson.subject}</Badge>
                  <span className="text-xs text-slate-500">Module 3 of 4</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{currentLesson.title}</h3>
                <p className="text-xs text-slate-500">Instructor: {activeTeacher.name} ({activeTeacher.title})</p>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium block">Lesson Progress</span>
                  <span className="text-lg font-extrabold text-indigo-600">68%</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => goToStep('classroom')}
                >
                  Resume Video
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-4 space-y-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-teal-400 h-2 rounded-full w-[68%] transition-all" />
              </div>

              {/* Modules breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {currentLesson.modules.map((mod, idx) => {
                  const isDone = idx < 2;
                  const isCurrent = idx === 2;
                  return (
                    <div
                      key={mod.id}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400/30'
                          : isDone
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Part {idx + 1}
                        </span>
                        {isDone ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        ) : null}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{mod.title.split(':')[1] || mod.title}</p>
                      <span className="text-[10px] text-slate-500">{mod.durationMinutes} mins</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Quick Start Curriculum Presets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-teal-600" />
                <span>Explore Curated AI Lessons</span>
              </h3>
              <span className="text-xs text-slate-500">One-click generate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topicPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleStartPreset(preset)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {preset.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{preset.estimatedMinutes} mins</span>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {preset.concepts.slice(0, 3).map((c) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                          {c}
                        </span>
                      ))}
                    </div>
                    <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Start
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Teacher Status & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Active AI Teacher Card */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned AI Mentor</span>
              <button
                onClick={() => goToStep('personalization')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Switch
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={activeTeacher.avatar}
                alt={activeTeacher.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20"
              />
              <div>
                <h4 className="font-bold text-slate-900">{activeTeacher.name}</h4>
                <p className="text-xs text-indigo-600 font-medium">{activeTeacher.title}</p>
                <span className="text-[11px] text-slate-500 block mt-0.5">{activeTeacher.specialty}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 italic">
              {activeTeacher.sampleVoiceQuote}
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon={<GraduationCap className="w-4 h-4 text-slate-500" />}
                onClick={() => goToStep('personalization')}
              >
                Configure Persona & Pedagogy
              </Button>
            </div>
          </Card>

          {/* Create Custom Lesson Card */}
          <Card variant="gradient" padding="md" className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Custom Lesson Generator</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Have a specific exam topic or textbook PDF? Let the AI Teacher parse your syllabus and craft interactive lectures with automated checkpoints.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              onClick={() => goToStep('create')}
            >
              Launch Lesson Builder
            </Button>
          </Card>

          {/* Spaced Repetition Card */}
          <Card padding="sm" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Daily Spaced Review</span>
              </div>
              <Badge variant="amber" size="xs">
                5 Cards Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Strengthen memory retention on: ATP Synthase Proton Motive Force & Cytochrome C.
            </p>
            <button
              onClick={() => goToStep('assessment')}
              className="w-full py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors border border-amber-200"
            >
              Start 3-Minute Quick Drill
            </button>
          </Card>

          {/* Tests & Coursework Hub Card */}
          <Card padding="sm" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Assessments & Work</span>
              </div>
              <Badge variant="indigo" size="xs">
                Standardized
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => goToStep('tests')}
                className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-indigo-600 mb-1">
                  <FileCheck className="w-4 h-4" />
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xs font-bold text-slate-800">Tests</div>
                <div className="text-[10px] text-slate-500">6 tests active</div>
              </button>

              <button
                onClick={() => goToStep('assignments')}
                className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-emerald-600 mb-1">
                  <CheckSquare className="w-4 h-4" />
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xs font-bold text-slate-800">Assignments</div>
                <div className="text-[10px] text-slate-500">6 coursework</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
