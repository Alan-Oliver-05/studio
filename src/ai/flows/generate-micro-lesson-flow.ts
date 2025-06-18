
'use server';
/**
 * @fileOverview Generates a micro-lesson for a given skill/topic.
 *
 * - generateMicroLesson - A function that generates the micro-lesson.
 * - GenerateMicroLessonInput - The input type for the function.
 * - GenerateMicroLessonOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile, GenerateMicroLessonInput as MicroLessonInputType, GenerateMicroLessonOutput as MicroLessonOutputType } from '@/types';

// Re-exporting with specific names for this flow file if needed, or use imported types directly.
export type GenerateMicroLessonInput = MicroLessonInputType;
export type GenerateMicroLessonOutput = MicroLessonOutputType;


// Define Zod schemas based on the types
const UserProfileSchema = z.custom<UserProfile>(); // Assuming UserProfile is complex, use z.custom or define detailed schema

const GenerateMicroLessonInputSchemaInternal = z.object({
  skillToTeach: z.string().min(3, { message: "Skill/topic must be at least 3 characters."}).describe('The specific skill or topic for the micro-lesson (e.g., "Chain Rule in Calculus").'),
  studentProfile: UserProfileSchema.describe("The student's profile to tailor the lesson."),
  learnerContextSummary: z.string().optional().describe('A brief summary of recent interactions or current learning context to help personalize the hook/analogy.'),
});

const GenerateMicroLessonOutputSchemaInternal = z.object({
  lessonMarkdown: z.string().describe('The entire micro-lesson formatted as a single Markdown string, including hook, example, guided practice, and quiz.'),
});

export async function generateMicroLesson(input: GenerateMicroLessonInput): Promise<GenerateMicroLessonOutput> {
  // Map external type to internal Zod schema for validation if necessary, or ensure they match.
  // For simplicity, assuming direct compatibility or prior validation.
  return generateMicroLessonFlow(input as z.infer<typeof GenerateMicroLessonInputSchemaInternal>);
}

const prompt = ai.definePrompt({
  name: 'generateMicroLessonPrompt',
  input: {schema: GenerateMicroLessonInputSchemaInternal},
  output: {schema: GenerateMicroLessonOutputSchemaInternal},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are "MentorAI," an adaptive tutor.
- You NEVER hallucinate facts.
- You use principles similar to CEFR, Bloom's taxonomy, and spaced-repetition science where applicable.
- Your output MUST be JSON, conforming exactly to the schema described, providing a single "lessonMarkdown" string.
- If unsure about generating content based on the input, ask clarifying follow-up questions instead of making assumptions (though for this flow, aim to generate based on given input).

Design a concise micro-lesson to teach the skill: {{{skillToTeach}}}.
The lesson should be formatted as a single Markdown string.

Learner Profile (for context, especially for the hook/analogy):
Name: {{{studentProfile.name}}}
Age: {{{studentProfile.age}}}
Learning Style: {{{studentProfile.learningStyle}}}
Education Focus: {{{studentProfile.educationCategory}}}
{{#if studentProfile.educationQualification.boardExams.board}}Board: {{{studentProfile.educationQualification.boardExams.board}}} - {{{studentProfile.educationQualification.boardExams.standard}}}{{/if}}
{{#if studentProfile.educationQualification.competitiveExams.specificExam}}Competitive Exam: {{{studentProfile.educationQualification.competitiveExams.specificExam}}}{{/if}}
{{#if studentProfile.educationQualification.universityExams.course}}University Course: {{{studentProfile.educationQualification.universityExams.course}}}{{/if}}

{{#if learnerContextSummary}}
Recent Learning Context:
{{{learnerContextSummary}}}
{{/if}}

The micro-lesson Markdown MUST include the following sections:

1.  **Hook/Analogy (Engage):**
    *   Start with a 2-3 sentence hook or analogy.
    *   If possible, try to reference the learner's interests (implicitly from their profile context if provided and relevant) or use a common, relatable example to make {{{skillToTeach}}} more engaging. If not, a general clear analogy is fine.

2.  **Explanation & Worked Example (Explain & Demonstrate):**
    *   Clearly explain the core concepts of {{{skillToTeach}}}.
    *   Provide one clear, step-by-step worked example. Use Markdown for formatting (e.g., bold for emphasis, lists for steps).

3.  **Guided Practice (Practice with Support):**
    *   Provide one guided practice question related to {{{skillToTeach}}}.
    *   The hint and/or solution for this practice question MUST be hidden by default and revealable. Use the HTML <details> and <summary> tags for this.
        Example format:
        \`\`\`markdown
        **Guided Practice:**
        [Your practice question here...]

        <details>
        <summary>Reveal Hint/Solution</summary>
        [Your hint or step-by-step solution here...]
        </details>
        \`\`\`

4.  **Formative Quiz (Check Understanding):**
    *   End with a short, 3-question multiple-choice quiz (MCQ) to check understanding of {{{skillToTeach}}}.
    *   Each MCQ should have 3-4 options, clearly labeled (e.g., A, B, C, D).
    *   Indicate the correct answer for each MCQ (e.g., "Correct Answer: B").
    *   Provide a brief explanation for each quiz question's correct answer.

Structure the entire output as a single Markdown string in the "lessonMarkdown" field of the JSON response. Use appropriate Markdown headings (e.g., ## Hook, ## Worked Example).
Ensure the language is clear, concise, and appropriate for the student's profile context.
Focus on the specific skill: {{{skillToTeach}}}.
`,
  config: {
    temperature: 0.4, // Balance creativity for analogy with factual content
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateMicroLessonFlow = ai.defineFlow(
  {
    name: 'generateMicroLessonFlow',
    inputSchema: GenerateMicroLessonInputSchemaInternal,
    outputSchema: GenerateMicroLessonOutputSchemaInternal,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output && output.lessonMarkdown) {
      return { lessonMarkdown: output.lessonMarkdown };
    }
    // Fallback if AI output is malformed
    console.warn("AI Micro-Lesson Generation: Output was malformed or missing lessonMarkdown.", output);
    throw new Error("AI failed to generate the micro-lesson content. The request might have been unclear or the topic too complex for a brief lesson.");
  }
);
