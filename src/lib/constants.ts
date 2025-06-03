
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
    // Academic Entrance
    { value: "JEE_Main_Advanced", label: "JEE Main / Advanced (Engineering)"},
    { value: "GATE", label: "GATE (PG Engineering & PSU)"},
    { value: "NEET_UG", label: "NEET UG (Medical)"},
    { value: "NEET_PG", label: "NEET PG (PG Medical)"},
    { value: "CAT", label: "CAT (Management)"},
    { value: "MAT", label: "MAT (Management)"},
    { value: "XAT", label: "XAT (Management)"},
    { value: "GMAT", label: "GMAT (Management)"},
    { value: "CLAT", label: "CLAT (Law)"},
    { value: "AILET", label: "AILET (Law)"},
    { value: "NATA", label: "NATA (Architecture)"},
    { value: "CEED", label: "CEED (Design)"},
    
    // UPSC & Defense
    { value: "UPSC_CSE", label: "UPSC Civil Services Exam (IAS, IPS, IFS, etc.)"},
    { value: "UPSC_NDA_NA", label: "UPSC NDA & NA Exam"},
    { value: "UPSC_CDS", label: "UPSC CDS Exam"},
    { value: "AFCAT", label: "AFCAT (Air Force)"},
    { value: "UPSC_Other", label: "UPSC Other Exams (IES, CAPF, etc. - Specify below)"},

    // SSC Exams
    { value: "SSC_CGL", label: "SSC CGL (Combined Graduate Level)"},
    { value: "SSC_CHSL", label: "SSC CHSL (Combined Higher Secondary Level)"},
    { value: "SSC_JE", label: "SSC JE (Junior Engineer)"},
    { value: "SSC_JHT", label: "SSC JHT (Junior Hindi Translator)"},
    { value: "SSC_GD_Constable", label: "SSC GD Constable"},
    { value: "SSC_Steno", label: "SSC Stenographer"},
    { value: "Other_SSC_Exam", label: "Other SSC Exam (Specify below)"},

    // Banking Exams
    { value: "Banking_PO_Clerk", label: "Banking Exams (IBPS PO/Clerk, SBI PO/Clerk)"},
    { value: "Banking_RBI", label: "RBI Exams (Grade B, Assistant)"},
    { value: "Banking_NABARD_SIDBI", label: "NABARD & SIDBI Exams"},
    { value: "Banking_Specialist_Officer", label: "Specialist Officer Banking Exams (IBPS SO, SBI SO, etc.)"},
    { value: "Other_Banking_Central", label: "Other Central Banking Exam (Specify below)"},

    // Railway Recruitment
    { value: "Railways_RRB", label: "Railways (RRB NTPC, Group D, ALP, JE, etc.)"},
    
    // Teaching and Research
    { value: "UGC_NET", label: "UGC NET (University Teaching & Research)" },
    { value: "CTET", label: "CTET (Central Teacher Eligibility Test)" },

    // Other Specialized & General
    { value: "Other_Specialized_Domain_Exam", label: "Specialized Domain Exam (Art, Sports, Design, etc. - Specify below)"},
    { value: "Other_Central_Exam", label: "Other Central Govt Exam / Entrance (Specify below)"},
];

export const COMPETITIVE_EXAM_TYPES_STATE = [
    { value: "State_Engineering_Entrance", label: "State Level Engineering Entrance (Specify Name)"},
    { value: "State_Medical_Entrance", label: "State Level Medical Entrance (Specify Name)"},
    { value: "State_Law_Entrance", label: "State Level Law Entrance (Specify Name)"},
    { value: "State_PSC_Group1", label: "State PSC - Group 1 / Class 1 (Specify State & Exam)"},
    { value: "State_PSC_Group2", label: "State PSC - Group 2 / Class 2 (Specify State & Exam)"},
    { value: "State_PSC_Other", label: "State PSC - Other Gazetted/Non-Gazetted (Specify State & Exam)"},
    { value: "State_Police_SI", label: "State Police - Sub Inspector (Specify State)"},
    { value: "State_Police_Constable", label: "State Police - Constable (Specify State)"},
    { value: "State_TET", label: "State Teacher Eligibility Test (TET) (Specify State)"},
    { value: "State_Cooperative_Banking", label: "State Cooperative Banking Exams (PO, Clerk) (Specify State)"},
    { value: "State_RRB", label: "Regional Rural Bank (RRB) Exams (PO, Clerk) (State specific if applicable)"},
    { value: "Other_Banking_State", label: "Other State Banking Exam (Specify State & Exam)"},
    { value: "Other_State_Exam", label: "Other State Govt Exam / Entrance (Specify State & Exam)"},
];

export const PROFESSIONAL_CERTIFICATION_EXAMS = [
  { value: "CS", label: "CS (Company Secretary)" },
  { value: "CPA", label: "CPA (Certified Public Accountant)" },
  { value: "CFA_Institute_CFA", label: "CFA (Chartered Financial Analyst - CFA Institute)" }, // Made distinct from a generic CFA
  { value: "ACCA", label: "ACCA (Association of Chartered Certified Accountants)" },
  { value: "FRM", label: "FRM (Financial Risk Manager)" },
  { value: "CA", label: "CA (Chartered Accountant - e.g., ICAI India)" }, // Added CA
  { value: "CMA", label: "CMA (Cost and Management Accountant - e.g., ICMAI India)" }, // Added CMA
  { value: "Other_Professional_Cert", label: "Other Professional Certification (Specify below)" },
];

export const PROFESSIONAL_CERTIFICATION_STAGES: Record<string, {value: string, label: string}[]> = {
  "CS": [
    { value: "foundation", label: "Foundation Programme" },
    { value: "executive", label: "Executive Programme" },
    { value: "professional", label: "Professional Programme" },
  ],
  "CPA": [
    { value: "education_req", label: "Educational Requirements" },
    { value: "exam_aud", label: "CPA Exam: Auditing and Attestation (AUD)" },
    { value: "exam_far", label: "CPA Exam: Financial Accounting and Reporting (FAR)" },
    { value: "exam_reg", label: "CPA Exam: Regulation (REG)" },
    { value: "exam_bec", label: "CPA Exam: Business Environment and Concepts (BEC)" },
    { value: "experience_req", label: "Experience Requirement" },
  ],
  "CFA_Institute_CFA": [ // Matches the value in PROFESSIONAL_CERTIFICATION_EXAMS
    { value: "level_1", label: "Level I" },
    { value: "level_2", label: "Level II" },
    { value: "level_3", label: "Level III" },
  ],
  "ACCA": [
    { value: "applied_knowledge", label: "Applied Knowledge" },
    { value: "applied_skills", label: "Applied Skills" },
    { value: "strategic_professional", label: "Strategic Professional" },
  ],
  "FRM": [
    { value: "part_1", label: "Part I" },
    { value: "part_2", label: "Part II" },
  ],
  "CA": [ // Example stages for CA (ICAI India)
    { value: "foundation_ca", label: "Foundation Course" },
    { value: "intermediate_ca", label: "Intermediate Course" },
    { value: "final_ca", label: "Final Course" },
    { value: "articleship_ca", label: "Articleship Training" },
  ],
  "CMA": [ // Example stages for CMA (ICMAI India)
    { value: "foundation_cma", label: "Foundation Course" },
    { value: "intermediate_cma", label: "Intermediate Course" },
    { value: "final_cma", label: "Final Course" },
    { value: "practical_training_cma", label: "Practical Training" },
  ]
  // No stages for "Other_Professional_Cert" by default, user specifies name.
};


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
