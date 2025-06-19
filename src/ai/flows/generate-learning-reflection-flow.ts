
'use server';
/**
 * @fileOverview Generates a learning reflection and motivational message for a student.
 *
 * - generateLearningReflection - A function that generates the reflection.
 * - GenerateLearningReflectionInput - The input type for the function.
 * - GenerateLearningReflectionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile, GenerateLearningReflectionInput as ReflectionInputType, GenerateLearningReflectionOutput as ReflectionOutputType } from '@/types';

// Re-exporting with specific names for this flow file if needed, or use imported types directly.
export type GenerateLearningReflectionInput = ReflectionInputType;
export type GenerateLearningReflectionOutput = ReflectionOutputType;

// Define Zod schemas based on the types
const UserProfileSchema = z.custom<UserProfile>();

const GenerateLearningReflectionInputSchemaInternal = z.object({
  studentProfile: UserProfileSchema.describe("The student's profile to tailor the reflection."),
  recentActivitySummary: z.string().min(10, { message: "Activity summary must be at least 10 characters."}).describe('A summary of the student\'s recent learning activities (e.g., topics studied, tasks completed).'),
});

const GenerateLearningReflectionOutputSchemaInternal = z.object({
  reflectionText: z.string().describe('A supportive and motivational reflection, including a highlight, an area for focus, and a reflective question.'),
});

export async function generateLearningReflection(input: GenerateLearningReflectionInput): Promise<GenerateLearningReflectionOutput> {
  return generateLearningReflectionFlow(input as z.infer<typeof GenerateLearningReflectionInputSchemaInternal>);
}

const prompt = ai.definePrompt({
  name: 'generateLearningReflectionPrompt',
  input: {schema: GenerateLearningReflectionInputSchemaInternal},
  output: {schema: GenerateLearningReflectionOutputSchemaInternal},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are "MentorAI," an adaptive tutor.
- You NEVER hallucinate facts.
- You use principles similar to CEFR, Bloom's taxonomy, and spaced-repetition science where applicable.
- Your output MUST be JSON, conforming exactly to the schema described, providing a single "reflectionText" string.
- If unsure, ask clarifying follow-up questions instead of making assumptions.

Learner Profile (for context):
Name: {{{studentProfile.name}}}
Age: {{{studentProfile.age}}}
Learning Style: {{{studentProfile.learningStyle}}}
Education Focus: {{{studentProfile.educationCategory}}}
{{#if studentProfile.educationQualification.boardExams.board}}Board: {{{studentProfile.educationQualification.boardExams.board}}} - {{{studentProfile.educationQualification.boardExams.standard}}}{{#if}}
{{#if studentProfile.educationQualification.competitiveExams.specificExam}}Competitive Exam: {{{studentProfile.educationQualification.competitiveExams.specificExam}}}{{#if}}
{{#if studentProfile.educationQualification.universityExams.course}}University Course: {{{studentProfile.educationQualification.universityExams.course}}}{{#if}}

Recent Learning Activity Summary:
{{{recentActivitySummary}}}

Based on the learner's profile and their recent activity:
1.  Identify and summarize one "biggest win" or significant positive aspect from their recent activity. This could be consistent engagement, exploring a new topic, completing tasks, etc.
2.  Suggest one specific area or skill they could "double-down" on or explore further to build on their progress.
3.  Use supportive, encouraging, and growth-mindset language throughout your response.
4.  Close with a single, open-ended reflective question that encourages the learner to think about their learning process, challenges, or future goals.

Format the entire output as a single string in the "reflectionText" field of the JSON response.
Example of desired output style for reflectionText:
"Hey {{{studentProfile.name}}}! It's great to see you've been actively engaging with [Mention a key topic/area from summary, e.g., 'Physics concepts'] and completed [X tasks/notes, if in summary] recently - that's a fantastic effort! To keep the momentum going, perhaps you could dive a bit deeper into [Suggest a specific related topic or skill, e.g., 'solving numerical problems in Optics'] this week. What's one small step you feel you could take to make progress in that area?"
`,
  config: {
    temperature: 0.7, // Allow for more creative and empathetic language
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateLearningReflectionFlow = ai.defineFlow(
  {
    name: 'generateLearningReflectionFlow',
    inputSchema: GenerateLearningReflectionInputSchemaInternal,
    outputSchema: GenerateLearningReflectionOutputSchemaInternal,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output && output.reflectionText) {
      return { reflectionText: output.reflectionText };
    }
    // Fallback if AI output is malformed
    console.warn("AI Learning Reflection: Output was malformed or missing reflectionText.", output);
    throw new Error("AI failed to generate the learning reflection. The activity summary might have been unclear.");
  }
);
