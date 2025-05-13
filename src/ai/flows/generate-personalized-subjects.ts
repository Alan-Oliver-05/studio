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
      board: z.string().optional().describe('The specific education board (e.g., CBSE, State Board Name).'),
      standard: z.string().optional().describe('The student\'s current standard or grade (e.g., 10th, 12th).'),
    }).optional(),
    competitiveExams: z.object({
      examType: z.string().optional().describe('The category of competitive exam (e.g., Engineering Entrance, Civil Services).'),
      specificExam: z.string().optional().describe('The name of the specific competitive exam (e.g., JEE Main, UPSC CSE).'),
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional().describe('The name of the university.'),
      collegeName: z.string().optional().describe('The name of the college, if applicable.'),
      course: z.string().optional().describe('The student\'s course or major (e.g., Bachelor of Science in Computer Science).'),
      currentYear: z.string().optional().describe('The student\'s current year of university study (e.g., 1st, 2nd).'),
    }).optional(),
  }).describe('The education qualification of the student, detailing their specific area of study.'),
});
export type GeneratePersonalizedSubjectsInput = z.infer<typeof GeneratePersonalizedSubjectsInputSchema>;

const GeneratePersonalizedSubjectsOutputSchema = z.object({
  subjects: z.array(
    z.object({
      name: z.string().describe('The name of the subject (e.g., Physics, Algebra, Indian History).'),
      description: z.string().describe('A brief description of the subject tailored to the student\'s context.'),
      studyMaterials: z.array(z.string()).describe('A list of key topics or areas within the subject, suitable for the student\'s level and educational context.'),
    })
  ).describe('A list of personalized subjects and study materials, highly relevant to the student\'s specific educational background and syllabus.'),
});
export type GeneratePersonalizedSubjectsOutput = z.infer<typeof GeneratePersonalizedSubjectsOutputSchema>;

export async function generatePersonalizedSubjects(input: GeneratePersonalizedSubjectsInput): Promise<GeneratePersonalizedSubjectsOutput> {
  return generatePersonalizedSubjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedSubjectsPrompt',
  input: {schema: GeneratePersonalizedSubjectsInputSchema},
  output: {schema: GeneratePersonalizedSubjectsOutputSchema},
  prompt: `You are an AI education platform. Your task is to generate a list of highly relevant academic subjects and key study topics for a student based on their detailed profile.
  The subjects should align with typical official curricula or syllabuses for the student's specific educational context (country, state, language, board, standard, exam type, or university course).
  Ensure that for the exact same student profile input, you consistently return the same list of subjects and their descriptions. Avoid variations unless the input profile itself changes.

  Student Profile:
  Name: {{{name}}}
  Age: {{{age}}}
  Gender: {{{gender}}}
  Country: {{{country}}}
  State/Province: {{{state}}}
  Preferred Language for Study: {{{preferredLanguage}}}

  Education Qualification Details:
  {{#if educationQualification.boardExams.board}}
  Board: {{{educationQualification.boardExams.board}}}
  Standard/Grade: {{{educationQualification.boardExams.standard}}}
  Focus: School curriculum (Board Exams)
  {{/if}}
  {{#if educationQualification.competitiveExams.examType}}
  Competitive Exam Category: {{{educationQualification.competitiveExams.examType}}}
  Specific Exam: {{{educationQualification.competitiveExams.specificExam}}}
  Focus: Competitive Exam Preparation
  {{/if}}
  {{#if educationQualification.universityExams.universityName}}
  University: {{{educationQualification.universityExams.universityName}}}
  {{#if educationQualification.universityExams.collegeName}}College: {{{educationQualification.universityExams.collegeName}}}{{/if}}
  Course/Major: {{{educationQualification.universityExams.course}}}
  Current Year: {{{educationQualification.universityExams.currentYear}}}
  Focus: University Curriculum
  {{/if}}

  Based on this precise profile, generate a list of subjects. For each subject:
  1.  Provide a "name" (e.g., "Physics for 12th Standard CBSE", "Quantitative Aptitude for Banking Exams", "Thermodynamics for Mechanical Engineering Year 2").
  2.  Provide a "description" tailored to this student.
  3.  List key "studyMaterials" (which are core topics or chapters) relevant to their specific syllabus or exam pattern.

  Output must be in the specified JSON format. If no specific education focus is clear, provide general knowledge subjects appropriate for the age and location.
  Consider the student's country: {{{country}}} and state: {{{state}}} to infer regional curriculum variations if applicable (e.g., for state boards).
  The output language for subject names and descriptions should be English, but the content focus should be based on the student's {{{preferredLanguage}}} learning context if specified for their curriculum.
  `,
  config: {
    temperature: 0.1, // Lower temperature for more deterministic/consistent and curriculum-focused output
  }
});

const generatePersonalizedSubjectsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedSubjectsFlow',
    inputSchema: GeneratePersonalizedSubjectsInputSchema,
    outputSchema: GeneratePersonalizedSubjectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure a valid output structure, returning empty subjects if AI fails or output is malformed
    if (output && Array.isArray(output.subjects)) {
        return output;
    }
    // Fallback if output is not as expected
    return { subjects: [] };
  }
);

