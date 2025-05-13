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
  subject: z.string().optional().describe('The main subject of study (e.g., Mathematics).'),
  lesson: z.string().optional().describe('The lesson within the subject (e.g., Algebra).'),
  specificTopic: z.string().describe('The specific topic of focus (e.g., Linear Equations, or "General Discussion" for general tutor).'),
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

  The student is currently focusing on:
  {{#if subject}}Subject: {{{subject}}}{{/if}}
  {{#if lesson}}Lesson: {{{lesson}}}{{/if}}
  Topic: {{{specificTopic}}}

  The student's question/request is: {{{question}}}

  Provide a comprehensive and personalized response to the student in their preferred language ({{{studentProfile.preferredLanguage}}}). Include relevant study materials and suggestions for further learning. Also include real-time external source suggestions.
  Format your response as a JSON object with "response" and "suggestions" fields.
  If the question is a greeting or very general, provide a welcoming response and ask how you can help with the specified topic.
  If the question is about a specific concept within the topic, explain it clearly and provide examples.
  If the student asks for problems or exercises, provide a few relevant ones.
  If the student seems stuck, offer hints or break down the problem.
  Maintain a supportive and encouraging tone.
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
    // Ensure a valid output structure even if AI fails to provide one
    if (output && output.response && Array.isArray(output.suggestions)) {
        return output;
    }
    // Fallback response if AI output is malformed
    return {
        response: "I'm having a little trouble formulating a full response right now. Could you try rephrasing or asking something else about the topic?",
        suggestions: []
    };
  }
);

