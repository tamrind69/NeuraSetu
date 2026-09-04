import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AppProviders } from './context';
import { Navbar } from './components/layout/Navbar';
import { FlowStepper } from './components/layout/FlowStepper';
import { DashboardPage } from './pages/DashboardPage';
import { CreateLessonPage } from './pages/CreateLessonPage';
import { UploadTopicPage } from './pages/UploadTopicPage';
import { PersonalizationPage } from './pages/PersonalizationPage';
import { LessonPlanPage } from './pages/LessonPlanPage';
import { ClassroomPage } from './pages/ClassroomPage';
import { InteractiveQuestionPage } from './pages/InteractiveQuestionPage';
import { AdaptiveFeedbackPage } from './pages/AdaptiveFeedbackPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { LearningReportPage } from './pages/LearningReportPage';
import { ProgressPage } from './pages/ProgressPage';
import { TestsDashboardPage } from './pages/TestsDashboardPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { TestResultPage } from './pages/TestResultPage';
import { AssignmentsDashboardPage } from './pages/AssignmentsDashboardPage';
import { AssignmentDetailsPage } from './pages/AssignmentDetailsPage';
import { AssignmentSubmissionPage } from './pages/AssignmentSubmissionPage';

const AppShell: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <FlowStepper />

      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent subtle footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} AI Teacher Studio. Adaptive Pedagogical Engine.</p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span>Socratic Feedback Mode</span>
            <span>•</span>
            <span>Mitochondria & Bioenergetics</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Live Simulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RootLayout: React.FC = () => {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'progress', element: <ProgressPage /> },

      // Lesson module area
      {
        path: 'lesson',
        children: [
          { index: true, element: <Navigate to="/lesson/create" replace /> },
          { path: 'create', element: <CreateLessonPage /> },
          { path: 'upload-topic', element: <UploadTopicPage /> },
          { path: 'personalization', element: <PersonalizationPage /> },
          { path: 'plan', element: <LessonPlanPage /> },
          { path: 'lesson-plan', element: <Navigate to="/lesson/plan" replace /> },
          { path: 'classroom', element: <ClassroomPage /> },
          { path: 'question', element: <InteractiveQuestionPage /> },
          { path: 'interactive-question', element: <Navigate to="/lesson/question" replace /> },
          { path: 'feedback', element: <AdaptiveFeedbackPage /> },
          { path: 'adaptive-feedback', element: <Navigate to="/lesson/feedback" replace /> },
          { path: 'assessment', element: <AssessmentPage /> },
          { path: 'report', element: <LearningReportPage /> },
          { path: 'progress', element: <ProgressPage /> },
        ],
      },

      // Tests module area
      {
        path: 'tests',
        children: [
          { index: true, element: <TestsDashboardPage /> },
          { path: ':testId', element: <TestTakingPage /> },
          { path: ':testId/result', element: <TestResultPage /> },
        ],
      },

      // Assignments module area
      {
        path: 'assignments',
        children: [
          { index: true, element: <AssignmentsDashboardPage /> },
          { path: ':id', element: <AssignmentDetailsPage /> },
          { path: ':id/submit', element: <AssignmentSubmissionPage /> },
        ],
      },

      // Backward compatibility / alias redirects
      { path: 'create', element: <Navigate to="/lesson/create" replace /> },
      { path: 'upload-topic', element: <Navigate to="/lesson/upload-topic" replace /> },
      { path: 'personalization', element: <Navigate to="/lesson/personalization" replace /> },
      { path: 'lesson-plan', element: <Navigate to="/lesson/plan" replace /> },
      { path: 'classroom', element: <Navigate to="/lesson/classroom" replace /> },
      { path: 'interactive-question', element: <Navigate to="/lesson/question" replace /> },
      { path: 'adaptive-feedback', element: <Navigate to="/lesson/feedback" replace /> },
      { path: 'assessment', element: <Navigate to="/lesson/assessment" replace /> },
      { path: 'report', element: <Navigate to="/lesson/report" replace /> },

      // Catch-all
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
