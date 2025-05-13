'use server';
/**
 * @fileOverview A Genkit flow to retrieve topics for a given lesson and subject, based on the student's profile.
 *
 * - getTopicsForLesson - A function that initiates the flow to get topics.
 * - GetTopicsForLessonInput - The input type for the getTopicsForLesson function.
 * - GetTopicsForLessonOutput - The return type for the getTopicsForLesson function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile } from '@/types'; // Assuming UserProfile type is defined

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number().or(z.string()),
  gender: z.string(),
  country: z.string(),
  state: z.string(),
  preferredLanguage: z.string(),
  educationCategory: z.string(),
  educationQualification: z.object({
    boardExams: z.object({ board: z.string().optional(), standard: z.string().optional() }).optional(),
    competitiveExams: z.object({ examType: z.string().optional(), specificExam: z.string().optional() }).optional(),
    universityExams: z.object({ universityName: z.string().optional(), collegeName: z.string().optional(), course: z.string().optional(), currentYear: z.string().optional() }).optional(),
  }),
});

const GetTopicsForLessonInputSchema = z.object({
  subjectName: z.string().describe('The name of the overall subject.'),
  lessonName: z.string().describe('The name of the lesson for which topics are requested.'),
  studentProfile: UserProfileSchema.describe('The profile of the student.'),
});
export type GetTopicsForLessonInput = z.infer<typeof GetTopicsForLessonInputSchema>;

const TopicSchema = z.object({
  name: z.string().describe('The name of the specific topic within the lesson.'),
  description: z.string().optional().describe('A brief description of the topic.'),
});

const GetTopicsForLessonOutputSchema = z.object({
  topics: z.array(TopicSchema).describe('A list of topics relevant to the lesson, subject, and student profile.'),
});
export type GetTopicsForLessonOutput = z.infer<typeof GetTopicsForLessonOutputSchema>;

export async function getTopicsForLesson(input: GetTopicsForLessonInput): Promise<GetTopicsForLessonOutput> {
  return getTopicsForLessonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTopicsForLessonPrompt',
  input: {schema: GetTopicsForLessonInputSchema},
  output: {schema: GetTopicsForLessonOutputSchema},
  prompt: `You are an AI assistant helping a student break down a lesson into specific topics.
  The student is studying the subject: {{{subjectName}}}
  And is focusing on the lesson: {{{lessonName}}}
  Student's profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Educational Focus: {{{studentProfile.educationCategory}}}
  Details: {{{studentProfile.educationQualification}}}

  Generate a list of specific topics within the lesson '{{{lessonName}}}' (under subject '{{{subjectName}}}') that are appropriate for this student.
  Each topic should have a 'name' and an optional 'description'.
  Return the topics as a JSON object with a "topics" array.
  For example, for the lesson "Algebra" in "Mathematics" for a 10th standard student, topics might include "Linear Equations", "Quadratic Equations", "Polynomials".
  For "Thermodynamics" in "Physics" for a university student, topics might include "Laws of Thermodynamics", "Heat Engines", "Entropy".
  Provide around 5-10 specific topics.
  `,
});

const getTopicsForLessonFlow = ai.defineFlow(
  {
    name: 'getTopicsForLessonFlow',
    inputSchema: GetTopicsForLessonInputSchema,
    outputSchema: GetTopicsForLessonOutputSchema,
  },
  async (input) => {
     const profileWithNumericAge = {
      ...input.studentProfile,
      age: Number(input.studentProfile.age) || 0,
    };
    const {output} = await prompt({...input, studentProfile: profileWithNumericAge });
    return output || { topics: [] };
  }
);
