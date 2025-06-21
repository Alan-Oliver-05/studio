"use client";

import type { UserProfile, LearningStyle } from "@/types"; 
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { format, parseISO, isValid } from "date-fns";

interface UserProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "userProfile"; // Updated Key for consistency

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as UserProfile;
        
        // Ensure nested objects exist to prevent runtime errors
        parsedProfile.educationQualification = {
          boardExams: parsedProfile.educationQualification?.boardExams || {board: "", standard: "", subjectSegment: ""}, 
          competitiveExams: parsedProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "", examDate: undefined}, 
          universityExams: parsedProfile.educationQualification?.universityExams || {universityName: "", collegeName: "", course: "", currentYear: ""},
        };

        // Normalize examDate to a valid string or undefined
        if (parsedProfile.educationQualification.competitiveExams) {
            if (parsedProfile.educationQualification.competitiveExams.examDate) {
                 try {
                    const dateObject = new Date(parsedProfile.educationQualification.competitiveExams.examDate);
                    if (isValid(dateObject)) {
                         parsedProfile.educationQualification.competitiveExams.examDate = format(dateObject, "yyyy-MM-dd");
                    } else {
                        parsedProfile.educationQualification.competitiveExams.examDate = undefined;
                    }
                } catch {
                    parsedProfile.educationQualification.competitiveExams.examDate = undefined;
                }
            }
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
    try {
      if (newProfile) {
        // Prepare the profile for saving, ensuring all nested objects are present
        const profileToSave: UserProfile = {
          ...newProfile,
          learningStyle: newProfile.learningStyle || 'balanced', 
          educationQualification: {
            boardExams: newProfile.educationQualification?.boardExams || {board: "", standard: "", subjectSegment: ""},
            competitiveExams: newProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "", examDate: undefined },
            universityExams: newProfile.educationQualification?.universityExams || {universityName: "", collegeName: "", course: "", currentYear: ""},
          },
        };

        // Normalize date before saving
        if (profileToSave.educationQualification.competitiveExams?.examDate) {
            const dateObject = new Date(profileToSave.educationQualification.competitiveExams.examDate);
            if(isValid(dateObject)) {
                profileToSave.educationQualification.competitiveExams.examDate = format(dateObject, "yyyy-MM-dd");
            } else {
                 profileToSave.educationQualification.competitiveExams.examDate = undefined;
            }
        }
        
        setProfileState(profileToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
      } else {
        setProfileState(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error) {
       console.error("Failed to save profile to localStorage:", error);
    }
  }, []);
  
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prevProfile => {
      if (!prevProfile) return null; 
      const updatedProfile = { ...prevProfile, ...updates };
      setProfile(updatedProfile); // Use the main setProfile function to handle saving and normalization
      return updatedProfile;
    });
  }, [setProfile]);

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