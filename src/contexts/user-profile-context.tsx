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
          boardExams: parsedProfile.educationQualification?.boardExams || {board: "", standard: "", subjectSegment: ""}, 
          competitiveExams: parsedProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "", examDate: undefined}, 
          universityExams: parsedProfile.educationQualification?.universityExams || {universityName: "", collegeName: "", course: "", currentYear: ""},
        };
        if (parsedProfile.educationQualification.competitiveExams) {
            if (!('stage' in parsedProfile.educationQualification.competitiveExams)) {
                parsedProfile.educationQualification.competitiveExams.stage = ""; 
            }
            if (parsedProfile.educationQualification.competitiveExams.examDate && 
                !(typeof parsedProfile.educationQualification.competitiveExams.examDate === 'string' && 
                  isValid(parseISO(parsedProfile.educationQualification.competitiveExams.examDate))) &&
                !(parsedProfile.educationQualification.competitiveExams.examDate instanceof Date)
             ) {
                try {
                    // Attempt to parse if it's a string that wasn't ISO or if it's a number (timestamp)
                    const dateObject = new Date(parsedProfile.educationQualification.competitiveExams.examDate);
                    if (isValid(dateObject)) {
                         parsedProfile.educationQualification.competitiveExams.examDate = format(dateObject, "yyyy-MM-dd");
                    } else {
                        parsedProfile.educationQualification.competitiveExams.examDate = undefined;
                    }
                } catch {
                    parsedProfile.educationQualification.competitiveExams.examDate = undefined;
                }
            } else if (parsedProfile.educationQualification.competitiveExams.examDate instanceof Date && isValid(parsedProfile.educationQualification.competitiveExams.examDate)) {
                 parsedProfile.educationQualification.competitiveExams.examDate = format(parsedProfile.educationQualification.competitiveExams.examDate, "yyyy-MM-dd");
            }
        }
        if (parsedProfile.educationQualification.boardExams && !('subjectSegment' in parsedProfile.educationQualification.boardExams)) {
            parsedProfile.educationQualification.boardExams.subjectSegment = "";
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
          boardExams: newProfile.educationQualification?.boardExams || {board: "", standard: "", subjectSegment: ""},
          competitiveExams: newProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "", examDate: undefined },
          universityExams: newProfile.educationQualification?.universityExams || {universityName: "", collegeName: "", course: "", currentYear: ""},
        },
      };
      if (profileToSave.educationQualification.competitiveExams) {
        if (!('stage' in profileToSave.educationQualification.competitiveExams)) {
          profileToSave.educationQualification.competitiveExams.stage = ""; 
        }
        if (profileToSave.educationQualification.competitiveExams.examDate && profileToSave.educationQualification.competitiveExams.examDate instanceof Date && isValid(profileToSave.educationQualification.competitiveExams.examDate)) {
            profileToSave.educationQualification.competitiveExams.examDate = format(profileToSave.educationQualification.competitiveExams.examDate, "yyyy-MM-dd");
        } else if (typeof profileToSave.educationQualification.competitiveExams.examDate === 'string' && !isValid(parseISO(profileToSave.educationQualification.competitiveExams.examDate))) {
            profileToSave.educationQualification.competitiveExams.examDate = undefined; // Clear invalid date strings
        }
      }
      if (profileToSave.educationQualification.boardExams && !('subjectSegment' in profileToSave.educationQualification.boardExams)) {
        profileToSave.educationQualification.boardExams.subjectSegment = "";
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
      
      let updatedProfileData = { ...prevProfile, ...updates };
      
      updatedProfileData.educationQualification = {
        boardExams: updatedProfileData.educationQualification?.boardExams || {board: "", standard: "", subjectSegment: ""},
        competitiveExams: updatedProfileData.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "", examDate: undefined },
        universityExams: updatedProfileData.educationQualification?.universityExams || {universityName: "", collegeName: "", course: "", currentYear: ""},
      };
      if (updatedProfileData.educationQualification.competitiveExams) {
        if (!('stage' in updatedProfileData.educationQualification.competitiveExams)) {
          updatedProfileData.educationQualification.competitiveExams.stage = ""; 
        }
        if (updatedProfileData.educationQualification.competitiveExams.examDate && updatedProfileData.educationQualification.competitiveExams.examDate instanceof Date && isValid(updatedProfileData.educationQualification.competitiveExams.examDate)) {
            updatedProfileData.educationQualification.competitiveExams.examDate = format(updatedProfileData.educationQualification.competitiveExams.examDate, "yyyy-MM-dd");
        } else if (typeof updatedProfileData.educationQualification.competitiveExams.examDate === 'string' && !isValid(parseISO(updatedProfileData.educationQualification.competitiveExams.examDate))) {
             updatedProfileData.educationQualification.competitiveExams.examDate = undefined;
        }
      }
      if (updatedProfileData.educationQualification.boardExams && !('subjectSegment' in updatedProfileData.educationQualification.boardExams)) {
          updatedProfileData.educationQualification.boardExams.subjectSegment = "";
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