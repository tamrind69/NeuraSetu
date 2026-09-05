import React from 'react';
import { UserProfileProvider } from './UserProfileContext';
import { NavigationProvider } from './NavigationContext';
import { LessonProvider } from './LessonContext';
import { TestsProvider } from './TestsContext';
import { AssignmentsProvider } from './AssignmentsContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProfileProvider>
      <NavigationProvider>
        <LessonProvider>
          <TestsProvider>
            <AssignmentsProvider>
              {children}
            </AssignmentsProvider>
          </TestsProvider>
        </LessonProvider>
      </NavigationProvider>
    </UserProfileProvider>
  );
};
