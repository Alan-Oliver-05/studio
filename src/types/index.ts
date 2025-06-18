

export interface BoardExamInfo {
  board?: string;
  standard?: string;
  subjectSegment?: string; 
}

export interface CompetitiveExamInfo {
  examType?: string; 
  specificExam?: string; 
  stage?: string; 
  examDate?: string; 
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
export type LanguageLearningMode = "voice" | "conversation" | "camera" | "document";


export interface UserProfile {
  id?: string; 
  name: string;
  age: number | ''; 
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

export interface InitialNodeData {
  id: string;
  text: string;
  parentId?: string;
  type?: 'root' | 'leaf' | 'detail'; 
  aiGenerated?: boolean;
  
  x?: number;
  y?: number;
  color?: string; 
}

export interface VisualElement {
  type: 'bar_chart_data' | 'line_chart_data' | 'flowchart_description' | 'image_generation_prompt' | 'interactive_mind_map_canvas';
  content: any | { 
    initialTopic?: string;
    initialNodes?: InitialNodeData[];
  }; 
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
  currentMindMapImageUri?: string | null; 
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

export interface ConversationSetupParams {
  scenario: string;
  userLanguage: string;
  aiLanguage: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  userRole?: string; 
  aiRole?: string;   
}


export interface InteractiveQAndAInput {
  studentProfile: {
    name: string;
    age: number; 
    country: string;
    preferredLanguage: string;
    learningStyle?: LearningStyle;
    educationQualification?: {
      boardExam?: { board?: string; standard?: string; subjectSegment?: string }; 
      competitiveExam?: { examType?: string; specificExam?: string; stage?: string; examDate?: string; }; 
      universityExam?: { universityName?: string; course?: string; currentYear?: string };
    };
  };
  subject: string;
  lesson: string;
  topic: string;
  studentAnswer?: string | null;
  previousQuestion?: string | null;
  conversationHistory?: string | null;
  currentStage?: QAS_Stage; 
  questionsAskedInStage?: number; 
  conversationScenario?: string;
  userLanguageRole?: string; 
  aiLanguageRole?: string;   
  conversationDifficulty?: 'basic' | 'intermediate' | 'advanced';
}

export interface InteractiveQAndAOutput {
  question: string; 
  feedback?: string | null; 
  isCorrect?: boolean | null; 
  suggestions?: string[]; 
  nextStage?: QAS_Stage; 
  isStageComplete?: boolean; 
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface MCQItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; 
  explanation?: string;
}

export type DocumentFileCategory = 'pdf' | 'docx' | 'audio' | 'slides' | 'unknown';

// Types for Diagnostic Quiz
export interface GenerateDiagnosticQuizInput {
  domain: string;
  numItems: number;
}

export interface DiagnosticQuizItem {
  question: string;
  options: string[];
  correctAnswer: string; // Text of the correct option
  difficulty: number; // 1-5
  explanation: string;
  bloomLevel: "remember" | "apply" | "analyze";
}

export interface GenerateDiagnosticQuizOutput {
  quizTitle: string;
  quizItems: DiagnosticQuizItem[];
}
