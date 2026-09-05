import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Paperclip,
  CheckSquare,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAssignments, useNavigation } from '../context';

export const AssignmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { assignmentsList, activeAssignmentId, startAssignment, assignmentDrafts, assignmentSubmissions } =
    useAssignments();
  const { goToStep } = useNavigation();

  const effectiveAssignmentId = id || activeAssignmentId;

  const activeAssignment = useMemo(() => {
    return assignmentsList.find((a) => a.id === effectiveAssignmentId) || assignmentsList[0];
  }, [assignmentsList, effectiveAssignmentId]);

  const tasks = activeAssignment.tasks || [];
  const draftAnswers = assignmentDrafts[activeAssignment.id] || {};
  const submission = assignmentSubmissions[activeAssignment.id];

  const answeredTasksCount = Object.keys(draftAnswers).filter((k) => !!draftAnswers[k]).length;
  const isSubmitted = activeAssignment.status === 'submitted';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => goToStep('assignments')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {activeAssignment.subject}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isSubmitted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeAssignment.status === 'overdue'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isSubmitted ? 'Submitted' : activeAssignment.status === 'overdue' ? 'Overdue' : 'Active'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                {activeAssignment.priority} Priority
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeAssignment.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {activeAssignment.description}
            </p>
          </div>

          {/* Action Call to Action */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            {isSubmitted ? (
              <button
                onClick={() => startAssignment(activeAssignment.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>View My Submission</span>
              </button>
            ) : (
              <button
                onClick={() => startAssignment(activeAssignment.id)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>{answeredTasksCount > 0 ? 'Continue Assignment' : 'Start Assignment'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-xs">
          {/* Instructor */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider block text-[11px]">
              Instructor
            </span>
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <img
                src={activeAssignment.instructorAvatar}
                alt={activeAssignment.instructorName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="truncate">{activeAssignment.instructorName}</span>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider block text-[11px]">
              Due Date
            </span>
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                activeAssignment.status === 'overdue' ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeAssignment.dueDate}</span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider block text-[11px]">
              Est. Time
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeAssignment.estimatedTime}</span>
            </div>
          </div>

          {/* Total Points */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium uppercase tracking-wider block text-[11px]">
              Weight
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{activeAssignment.totalPoints} Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Feedback Banner if graded */}
      {activeAssignment.grade && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instructor Evaluation & Feedback</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-xs">
              Score: {activeAssignment.grade.score} / {activeAssignment.grade.maxScore}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {activeAssignment.grade.feedback}
          </p>
          <div className="text-[11px] text-emerald-800/80 font-medium pt-1">
            Graded on {activeAssignment.grade.submittedDate}
          </div>
        </div>
      )}

      {/* Instructions Guidelines */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Submission Instructions & Guidelines</span>
        </h2>
        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {activeAssignment.instructions.map((instruction, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tasks Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Task Overview</h2>
            <p className="text-xs text-slate-500">
              {tasks.length} prompt questions to answer
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {answeredTasksCount} / {tasks.length} in draft
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">Task {idx + 1}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 capitalize">
                    {task.type.replace('-', ' ')}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                  {task.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {task.prompt}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700">
                  {task.points} Pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments / Reference Materials */}
      {activeAssignment.attachments && activeAssignment.attachments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span>Course Attachments & Reference Materials</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAssignment.attachments.map((file, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-500 uppercase">{file.size}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Downloading reference material: ${file.name}`)}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Download resource"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => goToStep('assignments')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assignments</span>
        </button>

        <button
          onClick={() => startAssignment(activeAssignment.id)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <span>{isSubmitted ? 'View Submission' : 'Go to Submission Form'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
