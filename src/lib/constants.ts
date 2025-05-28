
import type { TaskPriority, LearningStyle } from "@/types";

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
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  // Add more countries as needed
];

export const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "hi", label: "Hindi" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "mr", label: "Marathi" },
    { value: "bn", label: "Bengali" },
    // Add more languages
];

export const LEARNING_STYLES: { value: LearningStyle, label: string }[] = [
    { value: "visual", label: "Visual (Graphs, Diagrams, Images)" },
    { value: "auditory", label: "Auditory (Listening, Discussions)" },
    { value: "reading_writing", label: "Reading/Writing (Text, Notes)" },
    { value: "kinesthetic", label: "Kinesthetic (Hands-on, Interactive)" },
    { value: "balanced", label: "Balanced (Mix of styles)" },
];


export const EDUCATION_CATEGORIES = [
  { value: "board", label: "School Board Exams (e.g., 10th, 12th)" },
  { value: "competitive", label: "Competitive Exams (Govt Jobs, Entrance)" },
  { value: "university", label: "University / College Exams" },
  { value: "other", label: "Other / Not Applicable" },
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
  { value: "program_1_4_years", label: "1st year to 4th years" },
  { value: "program_1_5_years", label: "1st year to 5th years" },
  { value: "Postgraduate", label: "Postgraduate Study" },
  { value: "Doctoral", label: "Doctoral Study" },
  { value: "other", label: "Other" },
];

export const CENTRAL_BOARDS = [
  { value: "CBSE", label: "CBSE (Central Board of Secondary Education)" },
  { value: "CISCE", label: "CISCE (ISC/ICSE)" },
  { value: "NIOS", label: "NIOS (National Institute of Open Schooling)" },
  { value: "Other", label: "Other Central Board"},
];


export const COMPETITIVE_EXAM_TYPES_CENTRAL = [
    { value: "JEE", label: "JEE (Engineering Entrance)"},
    { value: "NEET", label: "NEET (Medical Entrance)"},
    { value: "UPSC_CSE", label: "UPSC Civil Services Exam"},
    { value: "UPSC_Other", label: "UPSC Other Exams (CDS, NDA, etc.)"},
    { value: "Banking_PO_Clerk", label: "Banking Exams (IBPS PO/Clerk, SBI PO/Clerk)"},
    { value: "SSC_CGL", label: "SSC CGL"},
    { value: "SSC_CHSL", label: "SSC CHSL"},
    { value: "Railways_RRB", label: "Railways (RRB NTPC, Group D)"},
    { value: "GATE", label: "GATE (Engineering PG Entrance)"},
    { value: "CAT", label: "CAT (MBA Entrance)"},
    { value: "Other_Central", label: "Other Central Govt Exam / Entrance"},
];

export const COMPETITIVE_EXAM_TYPES_STATE = [
    { value: "State_PSC_Group1", label: "State PSC - Group 1 / Class 1"},
    { value: "State_PSC_Group2", label: "State PSC - Group 2 / Class 2"},
    { value: "State_PSC_Other", label: "State PSC - Other Gazetted/Non-Gazetted"},
    { value: "State_Police_SI", label: "State Police - Sub Inspector"},
    { value: "State_Police_Constable", label: "State Police - Constable"},
    { value: "State_TET", label: "State Teacher Eligibility Test (TET)"},
    { value: "State_Engineering_Entrance", label: "State Engineering Entrance"},
    { value: "State_Medical_Entrance", label: "State Medical Entrance"},
    { value: "Other_State", label: "Other State Govt Exam / Entrance"},
];

export const TASK_CATEGORIES = [
    { value: "Assignment", label: "Assignment" },
    { value: "Concept Review", label: "Concept Review" },
    { value: "Practice Questions", label: "Practice Questions" },
    { value: "Project Work", label: "Project Work" },
    { value: "Study Session Prep", label: "Study Session Prep" },
    { value: "Exam Preparation", label: "Exam Preparation" },
    { value: "Reading Material", label: "Reading Material" },
    { value: "Revision", label: "Revision" },
    { value: "Personal Task", label: "Personal Task" },
    { value: "Other", label: "Other" },
];

export const TASK_PRIORITIES: { value: TaskPriority, label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
];

