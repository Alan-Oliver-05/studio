import { config } from 'dotenv';
config();

import '@/ai/flows/ai-guided-study-session.ts';
import '@/ai/flows/generate-personalized-subjects.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/get-lessons-for-subject.ts';
import '@/ai/flows/get-topics-for-lesson.ts';
