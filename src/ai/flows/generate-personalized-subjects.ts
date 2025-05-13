// src/ai/flows/generate-personalized-subjects.ts
'use server';
/**
 * @fileOverview Generates personalized subjects and study materials for a student based on their profile.
 *
 * - generatePersonalizedSubjects - A function that generates personalized subjects and study materials.
 * - GeneratePersonalizedSubjectsInput - The input type for the generatePersonalizedSubjects function.
 * - GeneratePersonalizedSubjectsOutput - The return type for the generatePersonalizedSubjects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedSubjectsInputSchema = z.object({
  name: z.string().describe('The name of the student.'),
  age: z.number().describe('The age of the student.'),
  gender: z.string().describe('The gender of the student.'),
  country: z.string().describe('The country of the student.'),
  state: z.string().describe('The state of the student.'),
  preferredLanguage: z.string().describe('The preferred language of the student.'),
  educationQualification: z.object({
    boardExams: z.object({
      board: z.string().optional(),
      standard: z.string().optional(),
    }).optional(),
    competitiveExams: z.object({
      examType: z.string().optional(),
      specificExam: z.string().optional(),
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional(),
      collegeName: z.string().optional(),
      course: z.string().optional(),
      currentYear: z.string().optional(),
    }).optional(),
  }).describe('The education qualification of the student.'),
});
export type GeneratePersonalizedSubjectsInput = z.infer<typeof GeneratePersonalizedSubjectsInputSchema>;

const GeneratePersonalizedSubjectsOutputSchema = z.object({
  subjects: z.array(
    z.object({
      name: z.string().describe('The name of the subject.'),
      description: z.string().describe('A brief description of the subject.'),
      studyMaterials: z.array(z.string()).describe('A list of study materials for the subject.'),
    })
  ).describe('A list of personalized subjects and study materials.'),
});
export type GeneratePersonalizedSubjectsOutput = z.infer<typeof GeneratePersonalizedSubjectsOutputSchema>;

export async function generatePersonalizedSubjects(input: GeneratePersonalizedSubjectsInput): Promise<GeneratePersonalizedSubjectsOutput> {
  return generatePersonalizedSubjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedSubjectsPrompt',
  input: {schema: GeneratePersonalizedSubjectsInputSchema},
  output: {schema: GeneratePersonalizedSubjectsOutputSchema},
  prompt: `You are an AI education platform that provides personalized subjects and study materials for students based on their profile.

  Based on the following student profile, generate a list of subjects and study materials that would be relevant to them.

  Student Profile:
  Name: {{{name}}}
  Age: {{{age}}}
  Gender: {{{gender}}}
  Country: {{{country}}}
  State: {{{state}}}
  Preferred Language: {{{preferredLanguage}}}
  Education Qualification: {{{educationQualification}}}

  Subjects and Study Materials:`,
});

const generatePersonalizedSubjectsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedSubjectsFlow',
    inputSchema: GeneratePersonalizedSubjectsInputSchema,
    outputSchema: GeneratePersonalizedSubjectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
