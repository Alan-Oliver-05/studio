
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
  { value: "competitive", label: "Competitive Exams (Govt Jobs, Entrance, Certifications)" },
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
  { value: "Other_Central_Board", label: "Other Central Board (Specify below)"},
];


export const COMPETITIVE_EXAM_TYPES_CENTRAL = [
    // Engineering
    { value: "JEE_Main_Advanced", label: "JEE Main / Advanced (Engineering)"},
    { value: "GATE", label: "GATE (PG Engineering & PSU)"},
    // Medical
    { value: "NEET_UG", label: "NEET UG (Medical)"},
    { value: "NEET_PG", label: "NEET PG (PG Medical)"},
    // Management
    { value: "CAT", label: "CAT (Management)"},
    { value: "MAT", label: "MAT (Management)"},
    { value: "XAT", label: "XAT (Management)"},
    { value: "GMAT", label: "GMAT (Management)"},
    // Law
    { value: "CLAT", label: "CLAT (Law)"},
    { value: "AILET", label: "AILET (Law)"},
    // Specialized Fields
    { value: "NATA", label: "NATA (Architecture)"},
    { value: "CEED", label: "CEED (Design)"},
    { value: "Other_Specialized_Entrance", label: "Other Specialized Entrance (Fine Arts, Hospitality, etc. - Specify below)"},
    // Existing Government & Banking
    { value: "UPSC_CSE", label: "UPSC Civil Services Exam"},
    { value: "UPSC_Other", label: "UPSC Other Exams (CDS, NDA, etc.)"},
    { value: "Banking_PO_Clerk", label: "Banking Exams (IBPS PO/Clerk, SBI PO/Clerk)"},
    { value: "Banking_RBI", label: "RBI Exams (Grade B, Assistant)"},
    { value: "Banking_NABARD_SIDBI", label: "NABARD & SIDBI Exams"},
    { value: "Banking_Specialist_Officer", label: "Specialist Officer Banking Exams (IBPS SO, SBI SO, etc.)"},
    { value: "Other_Banking_Central", label: "Other Central Banking Exam (Specify below)"},
    { value: "SSC_CGL", label: "SSC CGL"},
    { value: "SSC_CHSL", label: "SSC CHSL"},
    { value: "Railways_RRB", label: "Railways (RRB NTPC, Group D)"},
    // General Other
    { value: "Other_Central_Exam", label: "Other Central Govt Exam / Entrance (Specify below)"},
];

export const COMPETITIVE_EXAM_TYPES_STATE = [
    { value: "State_Engineering_Entrance", label: "State Level Engineering Entrance (Specify Name)"},
    { value: "State_Medical_Entrance", label: "State Level Medical Entrance (Specify Name)"},
    { value: "State_Law_Entrance", label: "State Level Law Entrance (Specify Name)"},
    // Existing State
    { value: "State_PSC_Group1", label: "State PSC - Group 1 / Class 1"},
    { value: "State_PSC_Group2", label: "State PSC - Group 2 / Class 2"},
    { value: "State_PSC_Other", label: "State PSC - Other Gazetted/Non-Gazetted"},
    { value: "State_Police_SI", label: "State Police - Sub Inspector"},
    { value: "State_Police_Constable", label: "State Police - Constable"},
    { value: "State_TET", label: "State Teacher Eligibility Test (TET)"},
    { value: "State_Cooperative_Banking", label: "State Cooperative Banking Exams (PO, Clerk)"},
    { value: "State_RRB", label: "Regional Rural Bank (RRB) Exams (PO, Clerk)"},
    { value: "Other_Banking_State", label: "Other State Banking Exam (Specify below)"},
    { value: "Other_State_Exam", label: "Other State Govt Exam / Entrance (Specify below)"},
];

export const PROFESSIONAL_CERTIFICATION_EXAMS = [
  { value: "CA", label: "CA (Chartered Accountant)" },
  { value: "CMA", label: "CMA (Cost and Management Accountant)" },
  { value: "CS", label: "CS (Company Secretary)" },
  { value: "CPA", label: "CPA (Certified Public Accountant)" },
  { value: "CFA", label: "CFA (Chartered Financial Analyst)" },
  { value: "ACCA", label: "ACCA (Association of Chartered Certified Accountants)" },
  { value: "FRM", label: "FRM (Financial Risk Manager)" },
  { value: "Other_Professional_Cert", label: "Other Professional Certification (Specify below)" },
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
