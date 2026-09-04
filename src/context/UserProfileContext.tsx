import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '../types';
import { mockUserProfile } from '../data/mockData';

interface UserProfileContextType {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  addXp: (amount: number) => void;
  incrementCompletedLessons: () => void;
  updateAccuracyRate: (newScorePercent: number) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);

  const addXp = (amount: number) => {
    setUserProfile((prev) => ({ ...prev, xp: prev.xp + amount }));
  };

  const incrementCompletedLessons = () => {
    setUserProfile((prev) => ({ ...prev, completedLessons: prev.completedLessons + 1 }));
  };

  const updateAccuracyRate = (newScorePercent: number) => {
    setUserProfile((prev) => ({
      ...prev,
      accuracyRate: Math.round((prev.accuracyRate * 9 + newScorePercent) / 10),
    }));
  };

  return (
    <UserProfileContext.Provider
      value={{
        userProfile,
        setUserProfile,
        addXp,
        incrementCompletedLessons,
        updateAccuracyRate,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
