'use server';
/**
 * @fileOverview A Genkit flow to retrieve lessons for a given subject based on the student's profile.
 *
 * - getLessonsForSubject - A function that initiates the flow to get lessons.
 * - GetLessonsForSubjectInput - The input type for the getLessonsForSubject function.
 * - GetLessonsForSubjectOutput - The return type for the getLessonsForSubject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile } from '@/types'; // Assuming UserProfile type is defined

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number().or(z.string()), // age can be string from form
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


const GetLessonsForSubjectInputSchema = z.object({
  subjectName: z.string().describe('The name of the subject for which lessons are requested.'),
  studentProfile: UserProfileSchema.describe('The profile of the student.'),
});
export type GetLessonsForSubjectInput = z.infer<typeof GetLessonsForSubjectInputSchema>;

const LessonSchema = z.object({
  name: z.string().describe('The name of the lesson or module.'),
  description: z.string().optional().describe('A brief description of the lesson or module.'),
});

const GetLessonsForSubjectOutputSchema = z.object({
  lessons: z.array(LessonSchema).describe('A list of lessons or modules relevant to the subject and student profile.'),
});
export type GetLessonsForSubjectOutput = z.infer<typeof GetLessonsForSubjectOutputSchema>;

export async function getLessonsForSubject(input: GetLessonsForSubjectInput): Promise<GetLessonsForSubjectOutput> {
  return getLessonsForSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLessonsForSubjectPrompt',
  input: {schema: GetLessonsForSubjectInputSchema},
  output: {schema: GetLessonsForSubjectOutputSchema},
  prompt: `You are an AI assistant helping a student find relevant lessons for a subject.
  Based on the subject name: {{{subjectName}}}
  And the student's profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Educational Focus: {{{studentProfile.educationCategory}}}
  Details: {{{studentProfile.educationQualification}}}

  Generate a list of key lessons or modules from the syllabus for the subject '{{{subjectName}}}' that are appropriate for this student.
  Each lesson should have a 'name' and an optional 'description'.
  Return the lessons as a JSON object with a "lessons" array.
  If the subject is very broad, provide foundational lessons. If specific education details are available (like standard or course), tailor the lessons accordingly.
  For example, for "Mathematics" for a 10th standard student, lessons might include "Algebra", "Geometry", "Trigonometry".
  For "Physics" for a university student in "Mechanical Engineering", lessons might be "Thermodynamics", "Fluid Mechanics", "Statics and Dynamics".
  Provide around 5-10 lessons.
  `,
});

const getLessonsForSubjectFlow = ai.defineFlow(
  {
    name: 'getLessonsForSubjectFlow',
    inputSchema: GetLessonsForSubjectInputSchema,
    outputSchema: GetLessonsForSubjectOutputSchema,
  },
  async (input) => {
    // Ensure age is a number for the profile if it's a string
    const profileWithNumericAge = {
      ...input.studentProfile,
      age: Number(input.studentProfile.age) || 0, // Default to 0 if conversion fails
    };

    const {output} = await prompt({ ...input, studentProfile: profileWithNumericAge });
    return output || { lessons: [] };
  }
);
