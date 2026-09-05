import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  ArrowRight,
  Sparkles,
  FileText,
  User,
  ArrowUpDown,
  BookOpen,
  Send,
} from 'lucide-react';
import { useAssignments } from '../context';
import { AssignmentItem } from '../types';
import { HeroBanner, MetricCard, Card, Badge, Button } from '../components/ui';

export const AssignmentsDashboardPage: React.FC = () => {
  const { assignmentsList, viewAssignment, startAssignment } = useAssignments();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'submitted' | 'overdue'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'due-date' | 'priority' | 'tasks'>('due-date');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = assignmentsList.length;
    const pending = assignmentsList.filter((a) => a.status === 'pending' || a.status === 'in-progress').length;
    const submitted = assignmentsList.filter((a) => a.status === 'submitted').length;
    const overdue = assignmentsList.filter((a) => a.status === 'overdue').length;

    return { total, pending, submitted, overdue };
  }, [assignmentsList]);

  // Unique Subjects for filter
  const subjects = useMemo(() => {
    const set = new Set(assignmentsList.map((a) => a.subject));
    return ['All', ...Array.from(set)];
  }, [assignmentsList]);

  // Filtered & Sorted Assignments
  const filteredAssignments = useMemo(() => {
    return assignmentsList
      .filter((a) => {
        const matchesSearch =
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'pending'
            ? a.status === 'pending' || a.status === 'in-progress'
            : a.status === statusFilter;
        const matchesSubject = selectedSubject === 'All' || a.subject === selectedSubject;
        return matchesSearch && matchesStatus && matchesSubject;
      })
      .sort((x, y) => {
        if (sortBy === 'priority') {
          const pOrder = { High: 0, Normal: 1, Low: 2 };
          return pOrder[x.priority] - pOrder[y.priority];
        }
        if (sortBy === 'tasks') {
          return y.taskCount - x.taskCount;
        }
        // Due Date default
        return 0;
      });
  }, [assignmentsList, searchQuery, statusFilter, selectedSubject, sortBy]);

  const getStatusMeta = (status: AssignmentItem['status']) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Submitted',
          variant: 'emerald' as const,
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'in-progress':
        return {
          label: 'In Progress',
          variant: 'indigo' as const,
          icon: <Clock className="w-3 h-3" />,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          variant: 'rose' as const,
          icon: <AlertTriangle className="w-3 h-3" />,
        };
      default:
        return {
          label: 'Pending',
          variant: 'amber' as const,
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  const getPriorityVariant = (priority: AssignmentItem['priority']) => {
    switch (priority) {
      case 'High':
        return 'rose' as const;
      case 'Normal':
        return 'blue' as const;
      case 'Low':
        return 'slate' as const;
      default:
        return 'slate' as const;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <HeroBanner
        tagText="Academic Coursework"
        tagIcon={<CheckSquare className="w-3.5 h-3.5 text-indigo-400" />}
        title="Assignments"
        description="View, complete, and submit your assignments."
        statBadge={{
          label: 'Submission Rate',
          value: `${Math.round((metrics.submitted / (metrics.total || 1)) * 100)}%`,
          valueColor: 'text-emerald-300',
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Total Assignments"
          value={metrics.total}
          badge={<span className="text-xs text-slate-500 font-medium">assigned</span>}
          icon={CheckSquare}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />

        <MetricCard
          label="Pending"
          value={metrics.pending}
          badge={<span className="text-xs text-amber-600 font-semibold">to complete</span>}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          label="Submitted"
          value={metrics.submitted}
          badge={<span className="text-xs text-emerald-600 font-semibold">turned in</span>}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <MetricCard
          label="Overdue"
          value={metrics.overdue}
          badge={<span className="text-xs text-rose-600 font-semibold">attention</span>}
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
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
              placeholder="Search assignments by title, instructor, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-none">
            {(['all', 'pending', 'submitted', 'overdue'] as const).map((tab) => {
              const label =
                tab === 'all'
                  ? 'All Tasks'
                  : tab === 'pending'
                  ? 'Pending / Active'
                  : tab === 'submitted'
                  ? 'Submitted'
                  : 'Overdue';

              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Filter & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Subject:
            </span>
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedSubject === subj
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="due-date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="tasks">Number of Tasks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Assignment Directory</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {filteredAssignments.length}
            </span>
          </h2>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No assignments found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No coursework matches your current search and filter settings.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedSubject('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const statusMeta = getStatusMeta(assignment.status);
              const priorityVariant = getPriorityVariant(assignment.priority);

              return (
                <Card
                  key={assignment.id}
                  className="hover:shadow-md hover:border-slate-300 transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                >
                  {/* Left Info */}
                  <div className="space-y-2.5 flex-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="indigo">{assignment.subject}</Badge>
                      <Badge variant={statusMeta.variant} icon={statusMeta.icon}>
                        {statusMeta.label}
                      </Badge>
                      <Badge variant={priorityVariant} shape="rounded" size="xs">
                        {assignment.priority} Priority
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => viewAssignment(assignment.id)}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {assignment.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {assignment.description}
                    </p>

                    {/* Metadata: Instructor, Due Date, Tasks */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={assignment.instructorAvatar}
                          alt={assignment.instructorName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-medium text-slate-700">
                          {assignment.instructorName}
                        </span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div
                        className={`flex items-center gap-1.5 font-medium ${
                          assignment.status === 'overdue' ? 'text-rose-600 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{assignment.dueDate}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{assignment.taskCount} Tasks</span>
                      </div>
                      {assignment.grade && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-bold text-emerald-600">
                            Grade: {assignment.grade.score}/{assignment.grade.maxScore}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewAssignment(assignment.id)}
                    >
                      Details
                    </Button>

                    {assignment.status === 'submitted' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => viewAssignment(assignment.id)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/70"
                      >
                        View Submission
                      </Button>
                    ) : assignment.status === 'in-progress' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                        onClick={() => startAssignment(assignment.id)}
                      >
                        Continue
                      </Button>
                    ) : assignment.status === 'overdue' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                        onClick={() => startAssignment(assignment.id)}
                      >
                        Complete Late
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                        onClick={() => startAssignment(assignment.id)}
                      >
                        Start Assignment
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
