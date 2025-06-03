

export interface BoardExamInfo {
  board?: string;
  standard?: string;
}

export interface CompetitiveExamInfo {
  examType?: string; // e.g. Central Govt, State Govt, ProfessionalCertifications, Other
  specificExam?: string; // e.g. JEE, NEET, UPSC CSE, CA, CMA, Custom Exam Name
  stage?: string; // Added for professional certification stages
  examDate?: string; // Added for exam due date, stored as YYYY-MM-DD
}

export interface UniversityExamInfo {
  universityName?: string;
  collegeName?: string;
  course?: string;
  currentYear?: string;
}

export interface EducationQualification {
  boardExams?: BoardExamInfo;
  competitiveExams?: CompetitiveExamInfo;
  universityExams?: UniversityExamInfo;
}

export type EducationCategory = 'board' | 'competitive' | 'university' | 'other' | '';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'balanced' | '';

export interface UserProfile {
  id?: string; // For potential future DB use
  name: string;
  age: number | ''; // Allow string for form input, convert to number on save
  gender: string;
  country: string;
  state: string;
  preferredLanguage: string;
  learningStyle?: LearningStyle; 
  educationCategory: EducationCategory;
  educationQualification: EducationQualification;
}

export interface Subject {
  name: string;
  description: string;
  studyMaterials: string[]; 
}

export interface Lesson {
  name: string;
  description?: string;
}

export interface Topic {
  name: string;
  description?: string;
}

export interface VisualElement {
  type: 'bar_chart_data' | 'line_chart_data' | 'flowchart_description' | 'image_generation_prompt';
  content: any; 
  caption?: string;
}

export type QAS_Stage = 'initial_material' | 'deeper_material' | 'out_of_syllabus' | 'completed';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestions?: string[];
  timestamp: number;
  attachmentPreview?: string | null; 
  visualElement?: VisualElement | null; 
  generatedImageUri?: string | null; 
  feedback?: string | null; 
  isCorrect?: boolean | null; 
  // For interactive Q&A state progression, set by AI
  aiNextStage?: QAS_Stage; 
  aiIsStageComplete?: boolean;
}

export interface Conversation {
  id: string;
  customTitle?: string; 
  topic: string; 
  subjectContext?: string; 
  lessonContext?: string; 
  studentProfile?: UserProfile;
  messages: Message[];
  summary?: string;
  lastUpdatedAt: number;
}

export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  category: string;
  dueDate?: string; 
  priority: TaskPriority;
  status: 'pending' | 'completed';
}

export interface Note {
  id: string;
  title: string;
  content: string; 
  createdAt: number;
  updatedAt: number;
}

// Input/Output types for interactiveQAndA flow, matching Zod schemas in the flow file
export interface InteractiveQAndAInput {
  studentProfile: {
    name: string;
    age: number; 
    country: string;
    preferredLanguage: string;
    learningStyle?: LearningStyle;
    educationQualification?: {
      boardExam?: { board?: string; standard?: string };
      competitiveExam?: { examType?: string; specificExam?: string; stage?: string; examDate?: string; }; // Added examDate
      universityExam?: { universityName?: string; course?: string; currentYear?: string };
    };
  };
  subject: string;
  lesson: string;
  topic: string;
  studentAnswer?: string | null;
  previousQuestion?: string | null;
  conversationHistory?: string | null;
  currentStage?: QAS_Stage; // This will be 'initial_material', 'deeper_material', 'out_of_syllabus'
  questionsAskedInStage?: number; // Tracks questions within the current stage
}

export interface InteractiveQAndAOutput {
  question: string; // The MCQ question or concluding remark
  feedback?: string | null; // Feedback on user's answer or intro to new stage
  isCorrect?: boolean | null; // Was the user's last answer correct?
  suggestions?: string[]; // Suggestions for further study *within the topic*
  nextStage?: QAS_Stage; // Stage the AI suggests moving to
  isStageComplete?: boolean; // Has the current stage's objective been met?
}
