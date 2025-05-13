'use server';
/**
 * @fileOverview This file defines a Genkit flow for conducting AI-guided study sessions.
 *
 * - aiGuidedStudySession - A function that initiates and manages the AI-guided study session flow.
 * - AIGuidedStudySessionInput - The input type for the aiGuidedStudySession function.
 * - AIGuidedStudySessionOutput - The return type for the aiGuidedStudySession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIGuidedStudySessionInputSchema = z.object({
  studentProfile: z.object({
    name: z.string().describe('The student\'s name.'),
    age: z.number().describe('The student\'s age.'),
    gender: z.string().describe('The student\'s gender.'),
    country: z.string().describe('The student\'s country.'),
    state: z.string().describe('The student\'s state.'),
    preferredLanguage: z.string().describe('The student\'s preferred language.'),
    educationQualification: z.object({
      boardExam: z.object({
        board: z.string().describe('The board exam name (e.g., CBSE, State Board).'),
        standard: z.string().describe('The student\'s current standard (e.g., 10th, 12th).'),
      }).optional(),
      competitiveExam: z.object({
        examType: z.string().describe('The type of competitive exam (e.g., JEE, NEET, UPSC).'),
        specificExam: z.string().describe('The specific competitive exam or job position.'),
      }).optional(),
      universityExam: z.object({
        universityName: z.string().describe('The name of the university.'),
        collegeName: z.string().describe('The name of the college.'),
        course: z.string().describe('The student\'s course of study.'),
        currentYear: z.string().describe('The student\'s current year of study.'),
      }).optional(),
    }).describe('The student\'s educational background.'),
  }).describe('The student profile information from the onboarding form.'),
  topic: z.string().describe('The topic for the study session.'),
  question: z.string().describe('The student\'s question or request for the study session.'),
});
export type AIGuidedStudySessionInput = z.infer<typeof AIGuidedStudySessionInputSchema>;

const AIGuidedStudySessionOutputSchema = z.object({
  response: z.string().describe('The AI response to the student\'s question, including study materials and suggestions.'),
  suggestions: z.array(z.string()).describe('Real-time external source suggestions for further study.'),
});
export type AIGuidedStudySessionOutput = z.infer<typeof AIGuidedStudySessionOutputSchema>;

export async function aiGuidedStudySession(input: AIGuidedStudySessionInput): Promise<AIGuidedStudySessionOutput> {
  return aiGuidedStudySessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGuidedStudySessionPrompt',
  input: {schema: AIGuidedStudySessionInputSchema},
  output: {schema: AIGuidedStudySessionOutputSchema},
  prompt: `You are an AI tutor guiding a student in a study session.

  The student's profile is as follows:
  Name: {{{studentProfile.name}}}
  Age: {{{studentProfile.age}}}
  Gender: {{{studentProfile.gender}}}
  Country: {{{studentProfile.country}}}
  State: {{{studentProfile.state}}}
  Preferred Language: {{{studentProfile.preferredLanguage}}}
  Education Qualification: {{studentProfile.educationQualification}}

  The student is currently studying the topic: {{{topic}}}
  The student's question/request is: {{{question}}}

  Provide a comprehensive and personalized response to the student, including relevant study materials and suggestions for further learning. Also include real-time external source suggestions.
  Format your response as a JSON object with "response" and "suggestions" fields.
  `,
});

const aiGuidedStudySessionFlow = ai.defineFlow(
  {
    name: 'aiGuidedStudySessionFlow',
    inputSchema: AIGuidedStudySessionInputSchema,
    outputSchema: AIGuidedStudySessionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
