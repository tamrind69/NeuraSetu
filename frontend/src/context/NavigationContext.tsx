import React, { createContext, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlowStep } from '../types';

export const FLOW_ORDER: FlowStep[] = [
  'dashboard',
  'create',
  'upload-topic',
  'personalization',
  'lesson-plan',
  'classroom',
  'interactive-question',
  'adaptive-feedback',
  'assessment',
  'report',
  'progress',
];

export const stepToPath = (step: FlowStep): string => {
  switch (step) {
    case 'dashboard':
      return '/dashboard';
    case 'create':
      return '/lesson/create';
    case 'upload-topic':
      return '/lesson/upload-topic';
    case 'personalization':
      return '/lesson/personalization';
    case 'lesson-plan':
      return '/lesson/plan';
    case 'classroom':
      return '/lesson/classroom';
    case 'interactive-question':
      return '/lesson/question';
    case 'adaptive-feedback':
      return '/lesson/feedback';
    case 'assessment':
      return '/lesson/assessment';
    case 'report':
      return '/lesson/report';
    case 'progress':
      return '/lesson/progress';
    case 'tests':
      return '/tests';
    case 'test-taking':
      return '/tests';
    case 'test-result':
      return '/tests';
    case 'assignments':
      return '/assignments';
    case 'assignment-details':
      return '/assignments';
    case 'assignment-submit':
      return '/assignments';
    default:
      return '/dashboard';
  }
};

export const pathToStep = (pathname: string): FlowStep => {
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '');

  if (cleanPath === '' || cleanPath === '/dashboard') return 'dashboard';
  if (cleanPath === '/lesson/create' || cleanPath === '/create') return 'create';
  if (cleanPath === '/lesson/upload-topic' || cleanPath === '/upload-topic') return 'upload-topic';
  if (cleanPath === '/lesson/personalization' || cleanPath === '/personalization') return 'personalization';
  if (cleanPath === '/lesson/plan' || cleanPath === '/lesson/lesson-plan' || cleanPath === '/lesson-plan')
    return 'lesson-plan';
  if (cleanPath === '/lesson/classroom' || cleanPath === '/classroom') return 'classroom';
  if (
    cleanPath === '/lesson/question' ||
    cleanPath === '/lesson/interactive-question' ||
    cleanPath === '/interactive-question'
  )
    return 'interactive-question';
  if (
    cleanPath === '/lesson/feedback' ||
    cleanPath === '/lesson/adaptive-feedback' ||
    cleanPath === '/adaptive-feedback'
  )
    return 'adaptive-feedback';
  if (cleanPath === '/lesson/assessment' || cleanPath === '/assessment') return 'assessment';
  if (cleanPath === '/lesson/report' || cleanPath === '/report') return 'report';
  if (cleanPath === '/lesson/progress' || cleanPath === '/progress') return 'progress';

  // Tests routing
  if (cleanPath.startsWith('/tests')) {
    if (cleanPath.endsWith('/result')) return 'test-result';
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length >= 2) return 'test-taking';
    return 'tests';
  }

  // Assignments routing
  if (cleanPath.startsWith('/assignments')) {
    if (cleanPath.endsWith('/submit')) return 'assignment-submit';
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length >= 2) return 'assignment-details';
    return 'assignments';
  }

  return 'dashboard';
};

interface NavigationContextType {
  currentStep: FlowStep;
  goToStep: (step: FlowStep, customPath?: string) => void;
  nextInFlow: () => void;
  prevInFlow: () => void;
  resetFlow: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = useMemo(() => {
    return pathToStep(location.pathname);
  }, [location.pathname]);

  const goToStep = (step: FlowStep, customPath?: string) => {
    const target = customPath || stepToPath(step);
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextInFlow = () => {
    const currentIndex = FLOW_ORDER.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < FLOW_ORDER.length - 1) {
      goToStep(FLOW_ORDER[currentIndex + 1]);
    }
  };

  const prevInFlow = () => {
    const currentIndex = FLOW_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(FLOW_ORDER[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const resetFlow = () => {
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider
      value={{
        currentStep,
        goToStep,
        nextInFlow,
        prevInFlow,
        resetFlow,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
