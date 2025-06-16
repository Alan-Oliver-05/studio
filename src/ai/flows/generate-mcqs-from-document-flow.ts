
'use server';
/**
 * @fileOverview Generates conceptual MCQs based on a document's name and type.
 *
 * - generateMcqsFromDocument - A function that generates MCQs.
 * - GenerateMcqsInput - The input type for the function.
 * - GenerateMcqsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DocumentFileCategory } from '@/types';

const GenerateMcqsInputSchema = z.object({
  documentName: z.string().min(3, {message: "Document name must be at least 3 characters."}).describe('The name of the "uploaded" document.'),
  documentType: z.enum(['pdf', 'docx', 'audio', 'slides', 'unknown']).describe('The type of the "uploaded" document.'),
});
export type GenerateMcqsInput = z.infer<typeof GenerateMcqsInputSchema>;

const McqItemSchema = z.object({
  id: z.string().describe("A unique ID for the MCQ."),
  question: z.string().describe('The MCQ question text.'),
  options: z.array(z.string()).min(3).max(4).describe('An array of 3-4 string options for the MCQ.'),
  correctAnswer: z.string().describe('The string content of the correct option from the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the correct answer is right.'),
});

const GenerateMcqsOutputSchema = z.object({
  mcqs: z.array(McqItemSchema).describe('An array of generated MCQs.'),
});
export type GenerateMcqsOutput = z.infer<typeof GenerateMcqsOutputSchema>;

export async function generateMcqsFromDocument(input: GenerateMcqsInput): Promise<GenerateMcqsOutput> {
  return generateMcqsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMcqsFromDocumentPrompt',
  input: {schema: GenerateMcqsInputSchema},
  output: {schema: GenerateMcqsOutputSchema},
  prompt: `You are an AI quiz master specializing in generating multiple-choice questions (MCQs) from document concepts.
The user has provided a file named '{{{documentName}}}' which is a '{{{documentType}}}' document.
Based on the typical content of such a document (you cannot see the actual content), generate 3-5 MCQs.

Each MCQ must have:
1.  'id': A unique string ID for the MCQ.
2.  'question': The question text.
3.  'options': An array of 3 or 4 string options.
4.  'correctAnswer': The string content of the correct option, which must be one of the provided options.
5.  'explanation': An optional brief explanation for why the correct answer is right.

For instance:
- If documentName is "Introduction_To_Economics.pdf" (pdf), create MCQs about basic economic principles like scarcity, supply/demand, etc.
- If documentName is "Cell_Biology_Chapter.docx" (docx), create MCQs about cell structures, functions, or processes.
- If documentName is "Project_Management_Basics.pptx" (slides), create MCQs on key project management terms or phases.

Output as a JSON array of objects, each conforming to the structure described. Ensure IDs are unique.
The options should be plausible distractors. The explanation should clarify the concept tested.
`,
  config: {
    temperature: 0.4, // Slightly more deterministic for quiz questions
  }
});

const generateMcqsFromDocumentFlow = ai.defineFlow(
  {
    name: 'generateMcqsFromDocumentFlow',
    inputSchema: GenerateMcqsInputSchema,
    outputSchema: GenerateMcqsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output && Array.isArray(output.mcqs)) {
      // Ensure IDs and correct answer format
      return {
        mcqs: output.mcqs.map((mcq, index) => {
          const correctAnswerIsValid = mcq.options.includes(mcq.correctAnswer);
          return {
            ...mcq,
            id: mcq.id || `mcq-${Date.now()}-${index}`,
            correctAnswer: correctAnswerIsValid ? mcq.correctAnswer : (mcq.options[0] || "Error: No valid correct answer")
          };
        })
      };
    }
    console.warn("AI output for MCQs was malformed or missing. Input was:", JSON.stringify(input));
    return { mcqs: [] }; // Fallback
  }
);
