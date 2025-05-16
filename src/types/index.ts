

export interface BoardExamInfo {
  board?: string;
  standard?: string;
}

export interface CompetitiveExamInfo {
  examType?: string;
  specificExam?: string;
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

export interface UserProfile {
  id?: string; // For potential future DB use
  name: string;
  age: number | '';
  gender: string;
  country: string;
  state: string;
  preferredLanguage: string;
  educationCategory: EducationCategory;
  educationQualification: EducationQualification;
}

export interface Subject {
  name: string;
  description: string;
  studyMaterials: string[]; // These can be interpreted as high-level topics or key areas
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
  content: any; // Could be chart data array, string description, or image prompt string
  caption?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestions?: string[];
  timestamp: number;
  attachmentPreview?: string | null; // For client-side display of image thumbnail
  visualElement?: VisualElement | null; // To hold structured visual data from AI
}

export interface Conversation {
  id: string; 
  topic: string; // This will store the most specific topic of conversation
  subjectContext?: string; // General subject for context
  lessonContext?: string; // Lesson for context
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
  content: string; // HTML content from the rich text editor
  createdAt: number;
  updatedAt: number;
}
