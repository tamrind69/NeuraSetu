import React from 'react';
import {
  FileBarChart2,
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Download,
  Share2,
  RotateCcw,
  BookOpen,
  Target,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { useLesson, useNavigation, useUserProfile } from '../context';

export const LearningReportPage: React.FC = () => {
  const { currentLesson, activeTeacher, assessmentResult } = useLesson();
  const { goToStep } = useNavigation();
  const { userProfile } = useUserProfile();

  const report = assessmentResult || {
    scorePercent: 94,
    correctCount: 4,
    totalQuestions: 4,
    timeSpentSeconds: 195,
    topicMastery: [
      { topic: 'Glycolysis & Cytosolic Energetics', percentage: 100, status: 'Mastered' as const },
      { topic: 'Citric Acid (Krebs) Cycle', percentage: 95, status: 'Mastered' as const },
      { topic: 'Electron Transport Chain Complexes', percentage: 92, status: 'Mastered' as const },
      { topic: 'Chemiosmosis & Proton Motive Force', percentage: 90, status: 'Proficient' as const },
    ],
    aiSummary:
      'Alex demonstrated exemplary mastery of cellular respiration concepts. You demonstrated deep intuition for the electrochemical gradient in the intermembrane space and accurately analyzed the clinical uncoupler scenario.',
    strengths: [
      'Crystal-clear mental model of mitochondrial membrane anatomy and proton reservoir localization',
      'Outstanding conceptual grasp of electron transport chain inhibition mechanisms',
      'High problem-solving confidence on multi-step biochemical pathways',
    ],
    focusAreas: [
      'Fine-tune stoichiometric ratios of NADH vs. FADH2 ATP yield (Complex I vs Complex II entry points)',
      'Review anaerobic fermentation shunts under prolonged cellular hypoxia',
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
            <FileBarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mastery Diagnostic Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Learning Performance Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Lesson: <span className="font-semibold text-slate-700">{currentLesson.title}</span> • Instructor: <span className="font-semibold text-slate-700">{activeTeacher.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => goToStep('progress')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>View Learning Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Score Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
            Overall Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{report.scorePercent}%</span>
            <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-md">Grade A</span>
          </div>
          <p className="text-xs text-emerald-100 font-medium">Mastery Standard Achieved</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Correct Responses
          </span>
          <div className="flex items-baseline gap-1 text-slate-900">
            <span className="text-3xl font-extrabold">{report.correctCount}</span>
            <span className="text-base text-slate-400 font-medium">/ {report.totalQuestions}</span>
          </div>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% on Checkpoint Check
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            XP Earned
          </span>
          <div className="flex items-baseline gap-2 text-slate-900">
            <span className="text-3xl font-extrabold">+150</span>
            <span className="text-xs text-indigo-600 font-bold">XP Bonus</span>
          </div>
          <p className="text-xs text-slate-500">Total XP: {userProfile.xp} XP</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Pacing Evaluation
          </span>
          <div className="flex items-baseline gap-2 text-slate-900">
            <span className="text-3xl font-extrabold">3m 15s</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Optimal deliberation speed</p>
        </div>
      </div>

      {/* Main Diagnostic Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Sub-Topic Mastery & Qualitative AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sub-Topic Mastery Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Competency & Sub-topic Diagnostics</span>
            </h3>

            <div className="space-y-4">
              {report.topicMastery.map((item) => (
                <div key={item.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.topic}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.status === 'Mastered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="font-extrabold text-slate-900">{item.percentage}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.percentage >= 90
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Teacher Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>Pedagogical Synthesis from {activeTeacher.name}</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "{report.aiSummary}"
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Demonstrated Strengths
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Focus Areas */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Recommended Focus Areas
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.focusAreas.map((foc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{foc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Next Actions & Certificate of Mastery */}
        <div className="space-y-6">
          {/* Certificate Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4 border border-indigo-700/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Award className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-teal-300 block">
                Certificate Awarded
              </span>
              <h4 className="font-bold text-white text-base mt-0.5">
                Mitochondria & Energetics Scholar
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Awarded to {userProfile.name} for achieving 94% on AP Cellular Respiration.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Verified by AI Teacher Studio • AP Bio Unit 3
            </div>
          </div>

          {/* Next Lesson Recommendation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Recommended Next Step
            </span>
            <div className="space-y-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md inline-block">
                Unit 3 • Lesson 4
              </span>
              <h4 className="font-bold text-slate-900 text-sm">
                Metabolic Flexibility & Lactic Fermentation
              </h4>
              <p className="text-xs text-slate-500">
                Explore what cells do when oxygen is unavailable—comparing yeast alcohol fermentation vs. human muscle lactate shunts.
              </p>
            </div>

            <button
              onClick={() => goToStep('progress')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Full Learning Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
