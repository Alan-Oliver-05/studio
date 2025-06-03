
"use client";

import type { UserProfile, LearningStyle } from "@/types"; // Added LearningStyle
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UserProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "eduai-profile";

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as UserProfile;
        
        parsedProfile.educationQualification = {
          boardExams: parsedProfile.educationQualification?.boardExams || {},
          competitiveExams: parsedProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: ""}, // Ensure stage exists
          universityExams: parsedProfile.educationQualification?.universityExams || {},
        };
        if (parsedProfile.educationQualification.competitiveExams && !('stage' in parsedProfile.educationQualification.competitiveExams)) {
            parsedProfile.educationQualification.competitiveExams.stage = ""; // Add stage if missing from old profiles
        }
        parsedProfile.learningStyle = parsedProfile.learningStyle || 'balanced';
        setProfileState(parsedProfile);
      }
    } catch (error) {
      console.error("Failed to load profile from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const setProfile = useCallback((newProfile: UserProfile | null) => {
    if (newProfile) {
      const profileToSave: UserProfile = {
        ...newProfile,
        learningStyle: newProfile.learningStyle || 'balanced', 
        educationQualification: {
          boardExams: newProfile.educationQualification?.boardExams || {},
          competitiveExams: newProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "" }, // Ensure stage
          universityExams: newProfile.educationQualification?.universityExams || {},
        },
      };
      if (profileToSave.educationQualification.competitiveExams && !('stage' in profileToSave.educationQualification.competitiveExams)) {
        profileToSave.educationQualification.competitiveExams.stage = ""; // Add stage if missing
      }
      setProfileState(profileToSave);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
    } else {
      setProfileState(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);
  
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prevProfile => {
      if (!prevProfile) return null; 
      
      const updatedProfileData = { ...prevProfile, ...updates };
      
      updatedProfileData.educationQualification = {
        boardExams: updatedProfileData.educationQualification?.boardExams || {},
        competitiveExams: updatedProfileData.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "" },
        universityExams: updatedProfileData.educationQualification?.universityExams || {},
      };
      if (updatedProfileData.educationQualification.competitiveExams && !('stage' in updatedProfileData.educationQualification.competitiveExams)) {
        updatedProfileData.educationQualification.competitiveExams.stage = ""; 
      }
      updatedProfileData.learningStyle = updatedProfileData.learningStyle || 'balanced';

      const updatedProfile = updatedProfileData as UserProfile;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    });
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, isLoading, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
