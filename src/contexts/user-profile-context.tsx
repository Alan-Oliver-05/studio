
"use client";

import type { UserProfile } from "@/types";
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
        // Ensure nested educationQualification objects exist to prevent errors
        parsedProfile.educationQualification = {
          boardExams: parsedProfile.educationQualification?.boardExams || {},
          competitiveExams: parsedProfile.educationQualification?.competitiveExams || {},
          universityExams: parsedProfile.educationQualification?.universityExams || {},
        };
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
      // Ensure nested educationQualification objects exist before saving
      const profileToSave: UserProfile = {
        ...newProfile,
        educationQualification: {
          boardExams: newProfile.educationQualification?.boardExams || {},
          competitiveExams: newProfile.educationQualification?.competitiveExams || {},
          universityExams: newProfile.educationQualification?.universityExams || {},
        },
      };
      setProfileState(profileToSave);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
    } else {
      setProfileState(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);
  
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prevProfile => {
      if (!prevProfile) return null; // Should not happen if update is called on existing profile
      
      const updatedProfileData = { ...prevProfile, ...updates };
      
      // Ensure nested educationQualification objects exist in the updated profile
      updatedProfileData.educationQualification = {
        boardExams: updatedProfileData.educationQualification?.boardExams || {},
        competitiveExams: updatedProfileData.educationQualification?.competitiveExams || {},
        universityExams: updatedProfileData.educationQualification?.universityExams || {},
      };

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
