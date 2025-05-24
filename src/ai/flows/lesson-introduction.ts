
'use server';
/**
 * @fileOverview This file defines a Genkit flow for introducing a subject lesson with a brief explanation.
 *
 * - lessonIntroduction - A function that initiates the lesson introduction flow.
 * - LessonIntroductionInput - The input type for the lessonIntroduction function.
 * - LessonIntroductionOutput - The return type for the lessonIntroduction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LessonIntroductionInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe("The student's name."),
    age: z.number().describe("The student's age."),
    // gender: z.string().optional().describe("The student's gender."), // Optional field
    country: z.string().describe("The student's country."),
    // state: z.string().optional().describe("The student's state/province."), // Optional field
    preferredLanguage: z.string().describe("The student's preferred language for learning."),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().optional().describe('The board exam name (e.g., CBSE, State Board Name).'),
        standard: z.string().optional().describe("The student's current standard (e.g., 10th, 12th)."),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().optional().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().optional().describe('The specific competitive exam or job position (e.g., JEE Main, UPSC CSE).'),
      }).optional(),
      universityExam: z.object({
        universityName: z.string().optional().describe('The name of the university.'),
        // collegeName: z.string().optional().describe('The name of the college, if applicable.'), // Optional field
        course: z.string().optional().describe("The student's course of study (e.g., B.Sc. Physics)."),
        currentYear: z.string().optional().describe("The student's current year of study (e.g., 1st, 2nd)."),
      }).optional(),
    }).optional().describe("The student's detailed educational background. All sub-fields are optional."),
  }).describe("The student profile information."),
  subject: z.string().describe('The subject of study (e.g., "Physics").'),
  lesson: z.string().describe('The lesson within the subject (e.g., "Optics").'),
}).describe('Input parameters for the lesson introduction flow.');
export type LessonIntroductionInput = z.infer<typeof LessonIntroductionInputSchema>;

const LessonIntroductionOutputSchema = z.object({
  introduction: z.string().describe('A brief, engaging introduction to the lesson, explaining its focus and relevance to the student, delivered in their preferred language.'),
}).describe('Output containing the lesson introduction.');
export type LessonIntroductionOutput = z.infer<typeof LessonIntroductionOutputSchema>;

export async function lessonIntroduction(input: LessonIntroductionInput): Promise<LessonIntroductionOutput> {
  return lessonIntroductionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonIntroductionPrompt',
  input: {schema: LessonIntroductionInputSchema},
  output: {schema: LessonIntroductionOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an AI Tutor. Your task is to provide a concise and engaging introduction for a specific lesson, tailored to the student's profile.

  Student Profile:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Country: {{{studentProfile.country}}}
  Preferred Language for Learning: {{{studentProfile.preferredLanguage}}}

  Educational Context (use this to make the intro relevant):
  {{#with studentProfile.educationQualification}}
    {{#if boardExam.board}}Board: {{{boardExam.board}}}{{#if boardExam.standard}}, Standard {{{boardExam.standard}}}{{/if}}.{{/if}}
    {{#if competitiveExam.examType}}Preparing for Exam: {{{competitiveExam.examType}}}{{#if competitiveExam.specificExam}} ({{{competitiveExam.specificExam}}}){{/if}}.{{/if}}
    {{#if universityExam.universityName}}Studying {{{universityExam.course}}} at {{{universityExam.universityName}}}{{#if universityExam.currentYear}}, Year {{{universityExam.currentYear}}}{{/if}}.{{/if}}
  {{else}}General learner.{{/with}}

  Subject: {{{subject}}}
  Lesson: {{{lesson}}}

  Instructions:
  1.  Craft an "introduction" in {{{studentProfile.preferredLanguage}}}.
  2.  The introduction should be brief (2-3 sentences).
  3.  Clearly state what the lesson "{{{lesson}}}" is about.
  4.  Briefly explain its importance or relevance to the student, considering their educational context.
  5.  Make it sound engaging and encouraging.
  6.  Output must be a JSON object with only one key: "introduction".
  `,
  config: {
    temperature: 0.6, // Slightly lower for more focused intro
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const lessonIntroductionFlow = ai.defineFlow(
  {
    name: 'lessonIntroductionFlow',
    inputSchema: LessonIntroductionInputSchema,
    outputSchema: LessonIntroductionOutputSchema,
  },
  async input => {
     const robustInput = { // Ensure nested objects exist for Handlebars
      ...input,
      studentProfile: {
        ...input.studentProfile,
        educationQualification: {
          boardExam: input.studentProfile.educationQualification?.boardExam || {},
          competitiveExam: input.studentProfile.educationQualification?.competitiveExam || {},
          universityExam: input.studentProfile.educationQualification?.universityExam || {},
        },
      },
    };
    const {output} = await prompt(robustInput);
    if (output && output.introduction) {
        return output;
    }
    // Fallback response if AI output is malformed
    return { introduction: `Welcome to the lesson on ${input.lesson}! Let's explore it together.` };
  }
);
