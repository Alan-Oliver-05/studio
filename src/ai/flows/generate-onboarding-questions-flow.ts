
'use server';
/**
 * @fileOverview Generates probing onboarding questions based on a learner's profile.
 *
 * - generateOnboardingQuestions - A function that generates the questions.
 * - GenerateOnboardingQuestionsInput - The input type for the function (essentially UserProfile).
 * - GenerateOnboardingQuestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile } from '@/types'; // Assuming UserProfile is defined and comprehensive

// Use the existing UserProfile schema as the input for this flow.
const GenerateOnboardingQuestionsInputSchema = z.custom<UserProfile>(); // Or define it explicitly if UserProfile is complex and needs specific zod schema here
export type GenerateOnboardingQuestionsInput = UserProfile;


const GenerateOnboardingQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).length(5).describe('An array of exactly five concise but probing questions.'),
});
export type GenerateOnboardingQuestionsOutput = z.infer<typeof GenerateOnboardingQuestionsOutputSchema>;

export async function generateOnboardingQuestions(input: GenerateOnboardingQuestionsInput): Promise<GenerateOnboardingQuestionsOutput> {
  return generateOnboardingQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOnboardingQuestionsPrompt',
  input: {schema: GenerateOnboardingQuestionsInputSchema},
  output: {schema: GenerateOnboardingQuestionsOutputSchema},
  prompt: `You are "MentorAI," an adaptive tutor.
- You NEVER hallucinate facts.
- You use principles similar to CEFR, Bloom's taxonomy, and spaced-repetition science where applicable.
- Your output MUST be JSON, conforming exactly to the schema described.
- If unsure, ask clarifying follow-up questions instead of making assumptions.

Based on the following learner profile, generate **five** concise but probing questions that will best surface the learner’s prior knowledge, mindset, and constraints, especially concerning their stated learning goals.
Focus on questions that go beyond simple factual recall and encourage reflection.

Learner Profile:
Name: {{{name}}}
Age: {{{age}}}
Gender: {{{gender}}}
Country: {{{country}}}
State: {{{state}}}
Preferred Language: {{{preferredLanguage}}}
Learning Style: {{{learningStyle}}}
Education Category: {{{educationCategory}}}

{{#if educationQualification.boardExams.board}}
Board Exam Details:
  Board: {{{educationQualification.boardExams.board}}}
  Standard: {{{educationQualification.boardExams.standard}}}
  {{#if educationQualification.boardExams.subjectSegment}}Subject Segment: {{{educationQualification.boardExams.subjectSegment}}}{{/if}}
{{/if}}

{{#if educationQualification.competitiveExams.examType}}
Competitive Exam Details:
  Exam Type: {{{educationQualification.competitiveExams.examType}}}
  Specific Exam: {{{educationQualification.competitiveExams.specificExam}}}
  {{#if educationQualification.competitiveExams.stage}}Stage: {{{educationQualification.competitiveExams.stage}}}{{/if}}
  {{#if educationQualification.competitiveExams.examDate}}Exam Date: {{{educationQualification.competitiveExams.examDate}}}{{/if}}
{{/if}}

{{#if educationQualification.universityExams.universityName}}
University Exam Details:
  University: {{{educationQualification.universityExams.universityName}}}
  {{#if educationQualification.universityExams.collegeName}}College: {{{educationQualification.universityExams.collegeName}}}{{/if}}
  Course: {{{educationQualification.universityExams.course}}}
  Current Year: {{{educationQualification.universityExams.currentYear}}}
{{/if}}

Return an array of exactly five string questions.
Example of a probing question (do not use this exact example):
"Considering your goal of preparing for the {Competitive Exam Name if provided, else general goal}, what specific topics within that domain do you feel least confident about right now, and why?"
"When you've studied for similar subjects/exams in the past, what study techniques have you found most effective, and which ones didn't work so well for you?"
"What are your biggest concerns or potential challenges you foresee in dedicating time to learn {Learning Goal/Subject}?"
`,
  config: {
    temperature: 0.6, // Allow for some creativity in question phrasing
  }
});

const generateOnboardingQuestionsFlow = ai.defineFlow(
  {
    name: 'generateOnboardingQuestionsFlow',
    inputSchema: GenerateOnboardingQuestionsInputSchema,
    outputSchema: GenerateOnboardingQuestionsOutputSchema,
  },
  async (input) => {
    // Ensure age is a number, as UserProfile might have it as string from form
    const profileWithNumericAge = {
      ...input,
      age: Number(input.age) || 0, 
    };
    const {output} = await prompt(profileWithNumericAge);
    if (output && output.questions && output.questions.length === 5) {
      return output;
    }
    // Fallback if AI doesn't return exactly 5 questions or output is malformed
    console.warn("AI did not return 5 probing questions, providing defaults. Output:", output);
    return {
      questions: [
        "What specific area within your studies do you find most challenging right now?",
        "How do you typically approach learning a new concept or skill?",
        "What are your primary motivations for achieving your current learning goals?",
        "Are there any past learning experiences (positive or negative) that significantly shape how you view studying now?",
        "What does a successful study session look like for you?"
      ]
    };
  }
);

```