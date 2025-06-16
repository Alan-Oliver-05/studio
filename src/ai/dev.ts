
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-guided-study-session.ts';
import '@/ai/flows/generate-image-from-prompt.ts';
import '@/ai/flows/generate-personalized-subjects.ts';
import '@/ai/flows/get-lessons-for-subject.ts';
import '@/ai/flows/get-topics-for-lesson.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/summarize-text-flow.ts';
// import '@/ai/flows/lesson-introduction.ts'; // Removed
// import '@/ai/flows/in-depth-tutorials.ts'; // Removed
// import '@/ai/flows/conversational-q-and-a.ts'; // Removed
import '@/ai/flows/interactive-q-and-a.ts';
// import '@/ai/flows/generate-mcq.ts'; // Removed
import '@/ai/flows/generate-flashcards-from-document-flow.ts';
import '@/ai/flows/generate-mcqs-from-document-flow.ts';
