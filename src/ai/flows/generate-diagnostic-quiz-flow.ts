
'use server';
/**
 * @fileOverview Generates a diagnostic quiz for a given domain.
 *
 * - generateDiagnosticQuiz - A function that generates the quiz.
 * - GenerateDiagnosticQuizInput - The input type for the function.
 * - GenerateDiagnosticQuizOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiagnosticQuizInputSchema = z.object({
  domain: z.string().min(3, { message: "Domain must be at least 3 characters."}).describe('The subject or domain for the quiz (e.g., "Calculus II", "Organic Chemistry Basics").'),
  numItems: z.number().min(3).max(20).default(5).describe('The number of questions to generate for the quiz (typically 5-10).'),
});
export type GenerateDiagnosticQuizInput = z.infer<typeof GenerateDiagnosticQuizInputSchema>;

const DiagnosticQuizItemSchema = z.object({
  question: z.string().describe("The question text."),
  options: z.array(z.string()).length(4).describe("An array of 4 string options for the MCQ. Typically labeled A, B, C, D conceptually."),
  correctAnswer: z.string().describe("The full string content of the correct option from the options array."),
  difficulty: z.number().min(1).max(5).describe("Difficulty level from 1 (easy) to 5 (hard)."),
  explanation: z.string().describe("A concise explanation for why the correct answer is right, and potentially why distractors are wrong."),
  bloomLevel: z.enum(["remember", "apply", "analyze"]).describe("The Bloom's Taxonomy level this question targets (remember, apply, analyze).")
});
export type DiagnosticQuizItem = z.infer<typeof DiagnosticQuizItemSchema>;

const GenerateDiagnosticQuizOutputSchema = z.object({
  quizTitle: z.string().describe("A suitable title for the generated quiz, e.g., 'Calculus Diagnostic Quiz'."),
  quizItems: z.array(DiagnosticQuizItemSchema).describe('An array of generated quiz items.'),
});
export type GenerateDiagnosticQuizOutput = z.infer<typeof GenerateDiagnosticQuizOutputSchema>;

export async function generateDiagnosticQuiz(input: GenerateDiagnosticQuizInput): Promise<GenerateDiagnosticQuizOutput> {
  return generateDiagnosticQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDiagnosticQuizPrompt',
  input: {schema: GenerateDiagnosticQuizInputSchema},
  output: {schema: GenerateDiagnosticQuizOutputSchema},
  prompt: `You are "MentorAI," an adaptive tutor.
- You NEVER hallucinate facts.
- You use principles similar to Bloom's taxonomy for question design.
- Your output MUST be JSON, conforming exactly to the schema described.
- If unsure about generating content based on the input, ask clarifying follow-up questions instead of making assumptions.

Design a diagnostic quiz for the domain: {DOMAIN}.
The quiz should have exactly {NUM_ITEMS} multiple-choice questions.

For each question, ensure:
1.  It assesses understanding within the specified {DOMAIN}.
2.  It has 4 plausible options.
3.  A clear 'correctAnswer' is provided (this MUST be the full text of the correct option).
4.  A 'difficulty' level is assigned on a 1-5 scale (1=very easy, 5=very hard).
5.  A concise 'explanation' is provided for the correct answer, possibly explaining why distractors are incorrect.
6.  A 'bloomLevel' is assigned from ["remember", "apply", "analyze"].

Vary the Bloom's levels across the {NUM_ITEMS} questions, aiming for approximately:
- 40% "remember" (recall facts, basic concepts)
- 30% "apply" (use information in new situations, solve problems)
- 30% "analyze" (draw connections, differentiate, examine critically)

Also, provide a 'quizTitle' for the quiz, e.g., "{DOMAIN} Diagnostic Quiz".

Return a JSON object containing 'quizTitle' and an array 'quizItems' where each item has "question", "options", "correctAnswer", "difficulty", "explanation", and "bloomLevel".
Example for a quiz item:
{
  "question": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Rome"],
  "correctAnswer": "Paris",
  "difficulty": 1,
  "explanation": "Paris is the capital and most populous city of France.",
  "bloomLevel": "remember"
}
`,
  config: {
    temperature: 0.3, // Slightly lower temperature for more factual quiz generation
  }
});

const generateDiagnosticQuizFlow = ai.defineFlow(
  {
    name: 'generateDiagnosticQuizFlow',
    inputSchema: GenerateDiagnosticQuizInputSchema,
    outputSchema: GenerateDiagnosticQuizOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.quizItems || output.quizItems.length === 0) {
      console.warn("Diagnostic Quiz Generation: AI output was empty or malformed.", output);
      throw new Error("AI failed to generate quiz items. The domain might be too niche or the request unclear.");
    }
    // Validate that each item has the correct correctAnswer format
    output.quizItems.forEach(item => {
        if (!item.options.includes(item.correctAnswer)) {
            console.warn(`Quiz item "${item.question.substring(0,30)}..." has correctAnswer "${item.correctAnswer}" not present in options: ${JSON.stringify(item.options)}. Correcting to first option as fallback.`);
            // Fallback: if AI fails to make correctAnswer one of the options, pick the first one.
            // This is a safety net; ideally, the prompt should be strong enough.
            item.correctAnswer = item.options[0];
        }
    });
    return output;
  }
);

