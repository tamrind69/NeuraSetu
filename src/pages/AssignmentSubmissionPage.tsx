import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Paperclip,
  Check,
  Calendar,
  Lock,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignments, useNavigation } from '../context';
import { Modal, Button, Badge } from '../components/ui';

export const AssignmentSubmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    assignmentsList,
    activeAssignmentId,
    assignmentDrafts,
    saveAssignmentDraft,
    submitAssignment,
    assignmentSubmissions,
  } = useAssignments();
  const { goToStep } = useNavigation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveAssignmentId = id || activeAssignmentId;

  const activeAssignment = useMemo(() => {
    return assignmentsList.find((a) => a.id === effectiveAssignmentId) || assignmentsList[0];
  }, [assignmentsList, effectiveAssignmentId]);

  const tasks = activeAssignment.tasks || [];
  const existingSubmission = assignmentSubmissions[activeAssignment.id];
  const initialDraft = assignmentDrafts[activeAssignment.id] || {};

  const [answers, setAnswers] = useState<Record<string, string>>(initialDraft);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(
    existingSubmission?.uploadedFileName
      ? {
          name: existingSubmission.uploadedFileName,
          size: existingSubmission.uploadedFileSize || '2.4 MB',
        }
      : null
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync draft answers
  const handleAnswerChange = (taskId: string, val: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [taskId]: val };
      saveAssignmentDraft(activeAssignment.id, updated);
      return updated;
    });
  };

  const handleManualSave = () => {
    saveAssignmentDraft(activeAssignment.id, answers);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFile({
      name: file.name,
      size: `${sizeInMb} MB`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleConfirmSubmit = () => {
    submitAssignment(
      activeAssignment.id,
      answers,
      uploadedFile?.name,
      uploadedFile?.size
    );
    setShowSubmitModal(false);
  };

  const isSubmitted = activeAssignment.status === 'submitted' || !!existingSubmission;
  const answeredCount = Object.keys(answers).filter((k) => !!answers[k]?.trim()).length;
  const totalTasks = tasks.length;
  const completionPercent = Math.round((answeredCount / (totalTasks || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/assignments/${activeAssignment.id}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignment Details</span>
        </button>

        {!isSubmitted && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {saveStatus === 'saved' ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Draft saved
                </span>
              ) : (
                'Auto-saves locally'
              )}
            </span>

            <button
              onClick={handleManualSave}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assignment</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner if Already Submitted */}
      {isSubmitted && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">
                Assignment Successfully Submitted!
              </h2>
              <p className="text-xs text-emerald-800">
                Turned in on {existingSubmission?.submittedAt || 'Just now'} • Your work has been archived and sent to your instructor for evaluation.
              </p>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => goToStep('assignments')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
            >
              Back to Assignments Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {activeAssignment.subject}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Due: {activeAssignment.dueDate}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeAssignment.title}
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block uppercase font-medium">Completion</span>
            <span className="text-lg font-bold text-indigo-600">
              {answeredCount} of {totalTasks} Tasks ({completionPercent}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Submission Tasks Form */}
      <div className="space-y-6">
        {tasks.map((task, idx) => {
          const currentAnswer = answers[task.id] || '';

          return (
            <div
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">Task {idx + 1}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
                      {task.type.replace('-', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {task.title}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold text-xs shrink-0">
                  {task.points} Points
                </span>
              </div>

              {/* Prompt */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {task.prompt}
              </p>

              {/* Inputs based on type */}
              {task.type === 'multiple-choice' && task.options ? (
                <div className="space-y-2.5 pt-1">
                  {task.options.map((opt, optIdx) => {
                    const isChecked = currentAnswer === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleAnswerChange(task.id, opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 font-semibold text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        } ${isSubmitted ? 'cursor-not-allowed opacity-90' : ''}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : task.type === 'essay' ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    disabled={isSubmitted}
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                    placeholder="Write your comprehensive analysis here... Include biological pathways, thermodynamic equations, and comparative rationale."
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Markdown/equations supported</span>
                    <span>
                      {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                    placeholder="Enter short answer or numerical formulation..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* File Upload Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Supporting Deliverables & Document Upload</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload laboratory graphs, calculations, diagrams, or PDF writeups (Max 25MB).
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {uploadedFile ? (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {uploadedFile.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {uploadedFile.size} • Ready for final submission
                  </span>
                </div>
              </div>

              {!isSubmitted && (
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove uploaded file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isSubmitted && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              } ${isSubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Drag & drop files here or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF, DOCX, PNG, JPG, or ZIP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => goToStep('assignments')}
        >
          Back to Assignments
        </Button>

        {!isSubmitted ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              iconPosition="right"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Assignment
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            iconPosition="right"
            onClick={() => goToStep('assignments')}
          >
            Return to Assignments
          </Button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Ready to Submit Assignment?"
        description="Once submitted, your responses will be evaluated by your instructor."
        icon={<Send className="w-5 h-5" />}
        footer={
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setShowSubmitModal(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleConfirmSubmit}
            >
              Yes, Submit Assignment
            </Button>
          </div>
        }
      >
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Completed Tasks:</span>
            <span className="font-bold text-slate-900">
              {answeredCount} of {totalTasks}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Deliverable Attached:</span>
            <span className="font-bold text-indigo-700">
              {uploadedFile ? uploadedFile.name : 'No file attached'}
            </span>
          </div>
          {answeredCount < totalTasks && (
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>You have {totalTasks - answeredCount} unanswered task(s).</span>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
