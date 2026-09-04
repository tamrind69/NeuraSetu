import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart2,
  GraduationCap,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTests, useNavigation } from '../context';
import { HeroBanner, MetricCard, Badge, Button, Card } from '../components/ui';

export const TestResultPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { testsList, activeTestId, testSubmissions, retakeTest } = useTests();
  const { goToStep } = useNavigation();

  const effectiveTestId = testId || activeTestId;

  const activeTest = useMemo(() => {
    return testsList.find((t) => t.id === effectiveTestId) || testsList[0];
  }, [testsList, effectiveTestId]);

  const submission = testSubmissions[activeTest.id];

  const questions = activeTest.questions || [];
  const totalQuestions = questions.length || activeTest.questionCount || 20;

  const [showReview, setShowReview] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Derived scores
  const correctCount = submission?.correctCount ?? activeTest.correctCount ?? 18;
  const percentage = submission?.percentage ?? activeTest.score ?? 90;
  const incorrectCount = submission?.incorrectCount ?? Math.max(0, totalQuestions - correctCount);
  const unansweredCount = submission?.unansweredCount ?? 0;
  const timeSpentSeconds = submission?.timeSpentSeconds ?? activeTest.timeSpentSeconds ?? 1305;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const gradeLetter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : 'D';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <HeroBanner
        tagText="Test Completed"
        tagIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        title={activeTest.title}
        description={`${activeTest.subject} • Submitted ${submission?.completedAt || 'Recently'}`}
        actions={
          <>
            <Button
              variant="glass"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => retakeTest(activeTest.id)}
            >
              Retake Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => goToStep('tests')}
            >
              Back to Tests
            </Button>
          </>
        }
      />

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <MetricCard
          label="Final Score"
          value={percentage}
          valueUnit="%"
          badge={<Badge variant="indigo" size="xs">Grade {gradeLetter}</Badge>}
          description={`${correctCount} / ${totalQuestions} correct`}
          icon={Award}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />

        <MetricCard
          label="Correct"
          value={correctCount}
          valueColor="text-emerald-600"
          badge={<span className="text-xs text-slate-500 font-medium">questions</span>}
          description={`${Math.round((correctCount / totalQuestions) * 100)}% accuracy`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <MetricCard
          label="Incorrect"
          value={incorrectCount}
          valueColor="text-rose-600"
          badge={<span className="text-xs text-slate-500 font-medium">missed</span>}
          description="review available"
          icon={XCircle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />

        <MetricCard
          label="Unanswered"
          value={unansweredCount}
          valueColor="text-slate-800"
          badge={<span className="text-xs text-slate-500 font-medium">omitted</span>}
          description="complete coverage"
          icon={AlertCircle}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />

        <MetricCard
          label="Time Taken"
          value={formatTime(timeSpentSeconds)}
          description={`out of ${activeTest.durationMinutes}m`}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Performance Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Pedagogical Performance Summary</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Outstanding performance! You demonstrated exceptional mastery of chemiosmotic coupling, electron transport complex stoichiometry, and bioenergetic thermodynamic regulation. You were exceptionally decisive on Complex IV inhibition mechanisms and proton gradient dissipation.
        </p>

        {/* Topic Mastery Strengths */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Chemiosmosis & PMF</span>
              <span className="text-emerald-700">100%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">ETC Complexes I-IV</span>
              <span className="text-emerald-700">95%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full w-[95%]" />
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Allosteric Regulation</span>
              <span className="text-indigo-700">88%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-indigo-600 h-1.5 rounded-full w-[88%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Review Answers Accordion Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Review Question Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Inspect your selected answers, correct answers, and conceptual explanations.
            </p>
          </div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>{showReview ? 'Hide Answers' : 'Show Answers'}</span>
            {showReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showReview && (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selectedOptionId = submission?.answers?.[q.id] || 'opt-b';
              const isCorrect = selectedOptionId === q.correctAnswerId;
              const isExpanded = expandedQuestionId === q.id || idx === 0;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 space-y-4 ${
                    isCorrect
                      ? 'border-slate-200/90 shadow-xs'
                      : 'border-rose-200 bg-rose-50/20 shadow-xs'
                  }`}
                >
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {q.topicTag}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Needs Review
                              </>
                            )}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {/* Options listing */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOptionId === opt.id;
                          const isOptionCorrect = opt.id === q.correctAnswerId;

                          let style = 'border-slate-200 bg-white text-slate-700';
                          if (isOptionCorrect) {
                            style = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold';
                          } else if (isOptionSelected && !isCorrect) {
                            style = 'border-rose-300 bg-rose-50 text-rose-950 line-through';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${style}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-[11px] w-5 text-center">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{opt.text}</span>
                              </div>
                              {isOptionCorrect && (
                                <span className="text-[11px] font-bold text-emerald-700 shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                                </span>
                              )}
                              {isOptionSelected && !isCorrect && (
                                <span className="text-[11px] font-bold text-rose-600 shrink-0 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Callout */}
                      <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/60 text-xs text-indigo-950 space-y-1">
                        <span className="font-bold text-indigo-900 block">Pedagogical Explanation:</span>
                        <p className="leading-relaxed text-slate-700">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => goToStep('tests')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Tests Dashboard</span>
        </button>
        <button
          onClick={() => retakeTest(activeTest.id)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake This Test</span>
        </button>
      </div>
    </div>
  );
};
