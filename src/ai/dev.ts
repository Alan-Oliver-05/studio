
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-guided-study-session.ts';
import '@/ai/flows/generate-personalized-subjects.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/get-lessons-for-subject.ts';
import '@/ai/flows/get-topics-for-lesson.ts';
import '@/ai/flows/generate-image-from-prompt.ts';
import '@/ai/flows/summarize-text-flow.ts';
import '@/ai/tools/web-search-tool.ts'; // Added import for the new web search tool
