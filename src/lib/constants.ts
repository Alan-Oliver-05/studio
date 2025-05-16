
import type { TaskPriority } from "@/types";

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

export const COUNTRIES = [
  { value: "USA", label: "United States" },
  { value: "India", label: "India" },
  { value: "Canada", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  // Add more countries as needed
];

// For simplicity, states will be text inputs.
// Preferred languages will also be text inputs or a small static list.
export const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "hi", label: "Hindi" },
    // Add more languages
];


export const EDUCATION_CATEGORIES = [
  { value: "board", label: "Board Exams (School)" },
  { value: "competitive", label: "Competitive Exams" },
  { value: "university", label: "University Exams" },
  { value: "other", label: "Other/Not Applicable" },
];

export const BOARD_STANDARDS = Array.from({ length: 12 }, (_, i) => ({
  value: `${i + 1}`,
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Standard`,
}));

export const UNIVERSITY_YEARS = [
  { value: "1st", label: "1st Year" },
  { value: "2nd", label: "2nd Year" },
  { value: "3rd", label: "3rd Year" },
  { value: "4th", label: "4th Year" },
  { value: "5th", label: "5th Year (if applicable)" },
  { value: "other", label: "Other" },
];

export const CENTRAL_BOARDS = [
  { value: "CBSE", label: "CBSE (Central Board of Secondary Education)" },
  { value: "CISCE", label: "CISCE (Council for the Indian School Certificate Examinations)" },
  { value: "NIOS", label: "NIOS (National Institute of Open Schooling)" },
  { value: "Other", label: "Other Central Board"},
];

// Add more constants as needed, e.g., competitive exam types
export const COMPETITIVE_EXAM_TYPES_CENTRAL = [
    { value: "JEE", label: "JEE (Engineering)"},
    { value: "NEET", label: "NEET (Medical)"},
    { value: "UPSC", label: "UPSC (Civil Services)"},
    { value: "Banking", label: "Banking (IBPS, SBI)"},
    { value: "SSC", label: "SSC (Staff Selection Commission)"},
    { value: "Defence", label: "Defence (NDA, CDS)"},
    { value: "Other", label: "Other Central Govt Exam"},
];

export const COMPETITIVE_EXAM_TYPES_STATE = [
    { value: "StatePSC", label: "State Public Service Commission (e.g., TNPSC, MPSC)"},
    { value: "StatePolice", label: "State Police Recruitment"},
    { value: "StateTeaching", label: "State Teacher Eligibility Test (TET)"},
    { value: "Other", label: "Other State Govt Exam"},
];

export const TASK_CATEGORIES = [
    { value: "Assignment", label: "Assignment" },
    { value: "Concept Review", label: "Concept Review" },
    { value: "Practice Question", label: "Practice Question" },
    { value: "Project", label: "Project" },
    { value: "Study Session", label: "Study Session" },
    { value: "Exam Preparation", label: "Exam Preparation" },
    { value: "Reading", label: "Reading" },
    { value: "Other", label: "Other" },
];

export const TASK_PRIORITIES: { value: TaskPriority, label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
];
