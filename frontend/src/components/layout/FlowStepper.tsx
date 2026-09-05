import React from 'react';
import {
  ChevronRight,
  LayoutDashboard,
  Sparkles,
  UploadCloud,
  Sliders,
  FileText,
  Video,
  HelpCircle,
  MessageSquare,
  ClipboardCheck,
  FileBarChart2,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useNavigation, FLOW_ORDER } from '../../context';
import { FlowStep } from '../../types';

interface StepMeta {
  id: FlowStep;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FlowStepper: React.FC = () => {
  const { currentStep, goToStep, nextInFlow, prevInFlow } = useNavigation();

  // Only render the lesson-flow stepper when the current route
  // belongs to the lesson module. Hide entirely for tests, assignments, etc.
  const isInLessonFlow = FLOW_ORDER.includes(currentStep);
  if (!isInLessonFlow) {
    return null;
  }

  const steps: StepMeta[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'create', label: 'Create Lesson', shortLabel: 'Create', icon: Sparkles },
    { id: 'upload-topic', label: 'Upload / Topic', shortLabel: 'Topic', icon: UploadCloud },
    { id: 'personalization', label: 'Personalization', shortLabel: 'Teacher', icon: Sliders },
    { id: 'lesson-plan', label: 'Lesson Plan', shortLabel: 'Plan', icon: FileText },
    { id: 'classroom', label: 'AI Classroom', shortLabel: 'Classroom', icon: Video },
    { id: 'interactive-question', label: 'Question', shortLabel: 'Quiz', icon: HelpCircle },
    { id: 'adaptive-feedback', label: 'Adaptive Feedback', shortLabel: 'Feedback', icon: MessageSquare },
    { id: 'assessment', label: 'Assessment', shortLabel: 'Test', icon: ClipboardCheck },
    { id: 'report', label: 'Learning Report', shortLabel: 'Report', icon: FileBarChart2 },
    { id: 'progress', label: 'Progress Tracking', shortLabel: 'Progress', icon: TrendingUp },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);


  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={prevInFlow}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Stepper Scroll Container */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-4xl mx-auto">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = idx < currentIndex;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold ring-2 ring-indigo-400/40 shadow-sm'
                        : isPast
                        ? 'text-teal-400 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isActive
                          ? 'bg-white text-indigo-700 font-bold'
                          : isPast
                          ? 'bg-teal-500/20 text-teal-300 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{step.label}</span>
                    <span className="md:hidden">{step.shortLabel}</span>
                  </button>

                  {idx < steps.length - 1 && (
                    <ChevronRight
                      className={`w-3 h-3 shrink-0 ${
                        idx < currentIndex ? 'text-teal-500/70' : 'text-slate-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={nextInFlow}
            disabled={currentIndex === -1 || currentIndex === steps.length - 1}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
