import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Award,
  Search,
  ArrowRight,
  Filter,
  BarChart3,
  PlayCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { useTests } from '../context';
import { TestItem } from '../types';
import { HeroBanner, MetricCard, Card, Badge, Button } from '../components/ui';

export const TestsDashboardPage: React.FC = () => {
  const { testsList, startTest, continueTest, viewTestResult } = useTests();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = testsList.length;
    const completed = testsList.filter((t) => t.status === 'completed').length;
    const inProgress = testsList.filter((t) => t.status === 'in-progress').length;
    const completedWithScore = testsList.filter((t) => t.status === 'completed' && t.score !== undefined);
    const avgScore =
      completedWithScore.length > 0
        ? Math.round(
            completedWithScore.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedWithScore.length
          )
        : 0;

    return { total, completed, inProgress, avgScore };
  }, [testsList]);

  // Unique Subjects for filter
  const subjects = useMemo(() => {
    const set = new Set(testsList.map((t) => t.subject));
    return ['All', ...Array.from(set)];
  }, [testsList]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return testsList.filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
      const matchesSubject = selectedSubject === 'All' || test.subject === selectedSubject;
      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [testsList, searchQuery, statusFilter, selectedSubject]);

  const getDifficultyVariant = (difficulty: TestItem['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return 'emerald' as const;
      case 'Intermediate':
        return 'blue' as const;
      case 'Hard':
        return 'amber' as const;
      case 'Advanced':
        return 'purple' as const;
      default:
        return 'slate' as const;
    }
  };

  const getStatusMeta = (status: TestItem['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', variant: 'emerald' as const, icon: <CheckCircle2 className="w-3 h-3" /> };
      case 'in-progress':
        return { label: 'In Progress', variant: 'amber' as const, icon: <Clock className="w-3 h-3" /> };
      default:
        return { label: 'Not Started', variant: 'slate' as const, icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <HeroBanner
        tagText="Standardized Assessments"
        tagIcon={<FileCheck className="w-3.5 h-3.5 text-indigo-400" />}
        title="Tests"
        description="Take tests, track your progress, and improve your performance."
        statBadge={{
          label: 'Overall Accuracy',
          value: `${metrics.avgScore}%`,
          valueColor: 'text-teal-300',
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Total Tests"
          value={metrics.total}
          badge={<span className="text-xs text-slate-500 font-medium">available</span>}
          icon={FileCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />

        <MetricCard
          label="Completed"
          value={metrics.completed}
          badge={
            <span className="text-xs text-emerald-600 font-semibold">
              {Math.round((metrics.completed / (metrics.total || 1)) * 100)}% done
            </span>
          }
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <MetricCard
          label="In Progress"
          value={metrics.inProgress}
          badge={<span className="text-xs text-amber-600 font-semibold">active</span>}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          label="Average Score"
          value={metrics.avgScore}
          valueUnit="%"
          badge={<span className="text-xs text-emerald-600 font-semibold">Grade A</span>}
          icon={Award}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests by title, subject, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-none">
            {(['all', 'not-started', 'in-progress', 'completed'] as const).map((tab) => {
              const label =
                tab === 'all'
                  ? 'All Tests'
                  : tab === 'not-started'
                  ? 'Not Started'
                  : tab === 'in-progress'
                  ? 'In Progress'
                  : 'Completed';

              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Subject:
          </span>
          <div className="flex items-center gap-1.5">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedSubject === subj
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Available Tests ({filteredTests.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-scored with AI diagnostics</span>
        </div>

        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">No matching tests found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or filter to find tests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => {
              const statusMeta = getStatusMeta(test.status);
              const diffVariant = getDifficultyVariant(test.difficulty);

              return (
                <Card
                  key={test.id}
                  className="hover:shadow-md hover:border-slate-300 transition-all p-5 sm:p-6 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Subject & Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="indigo">{test.subject}</Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusMeta.variant} icon={statusMeta.icon}>
                          {statusMeta.label}
                        </Badge>
                        <Badge variant={diffVariant} shape="rounded" size="xs">
                          {test.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Test Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {test.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>

                    {/* Metadata Specs */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {test.questionCount} Questions
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {test.durationMinutes} Mins
                      </span>
                      {test.score !== undefined && (
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600 ml-auto">
                          <Award className="w-3.5 h-3.5" />
                          Score: {test.score}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      {test.lastTakenDate ? (
                        <span>Completed {test.lastTakenDate}</span>
                      ) : (
                        <span>Estimated: {test.durationMinutes} minutes</span>
                      )}
                    </div>

                    {test.status === 'completed' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<BarChart3 className="w-3.5 h-3.5" />}
                        onClick={() => viewTestResult(test.id)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/70"
                      >
                        View Result
                      </Button>
                    ) : test.status === 'in-progress' ? (
                      <Button
                        size="sm"
                        variant="warning"
                        icon={<PlayCircle className="w-3.5 h-3.5" />}
                        onClick={() => continueTest(test.id)}
                      >
                        Continue Test
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<PlayCircle className="w-3.5 h-3.5" />}
                        onClick={() => startTest(test.id)}
                      >
                        Start Test
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
