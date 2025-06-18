'use server';
/**
 * @fileOverview Generates conceptual MCQs based on a document's name and type, simulating RAG.
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
  question: z.string().describe('The MCQ question text, focusing on a specific detail or concept from the document.'),
  options: z.array(z.string()).min(3).max(4).describe('An array of 3-4 string options for the MCQ, including plausible distractors related to the document content.'),
  correctAnswer: z.string().describe('The string content of the correct option from the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the correct answer is right, referencing conceptual document details.'),
});

const GenerateMcqsOutputSchema = z.object({
  mcqs: z.array(McqItemSchema).describe('An array of generated MCQs, reflecting specific details conceptually found in the document.'),
});
export type GenerateMcqsOutput = z.infer<typeof GenerateMcqsOutputSchema>;

export async function generateMcqsFromDocument(input: GenerateMcqsInput): Promise<GenerateMcqsOutput> {
  return generateMcqsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMcqsFromDocumentPrompt',
  input: {schema: GenerateMcqsInputSchema},
  output: {schema: GenerateMcqsOutputSchema},
  prompt: `You are an AI quiz master acting as a Retrieval Augmented Generation (RAG) agent.
Imagine you have thoroughly read and analyzed the document titled '{{{documentName}}}', which is a '{{{documentType}}}' file.
Based on the **specific information, arguments, data, or nuanced points** you would expect to find *within such a document*, generate 3-5 multiple-choice questions (MCQs).
Avoid generic questions. Each MCQ should test understanding of details that seem extracted directly from the document.

Each MCQ must have:
1.  'id': A unique string ID.
2.  'question': The question text, targeted at a specific aspect of the conceptual document content.
3.  'options': An array of 3 or 4 string options. Distractors should be plausible and related to the document's subject matter.
4.  'correctAnswer': The exact string content of the correct option.
5.  'explanation': An optional brief explanation clarifying the correct answer, ideally referencing conceptual points from the document.

For instance:
- If documentName is "Renewable_Energy_Policy_Report_2023.pdf" (pdf), an MCQ might be:
    Question: "According to the 2023 report, what was the primary challenge cited for solar panel adoption in rural areas?"
    Options: ["High initial cost", "Lack of skilled technicians", "Grid instability", "Land acquisition issues"]
    CorrectAnswer: "Lack of skilled technicians"
    Explanation: "The report (conceptually Section 3.2) specifically identified the shortage of trained personnel for installation and maintenance as the main barrier for rural solar adoption, more so than initial cost in the surveyed regions."
- If documentName is "Shakespeare_Hamlet_Critical_Analysis.docx" (docx), an MCQ could be:
    Question: "Which critical theory, as discussed in the analysis, offers a unique perspective on Ophelia's madness?"
    Options: ["Marxist theory", "Feminist psychoanalytic theory", "Post-structuralism", "New Historicism"]
    CorrectAnswer: "Feminist psychoanalytic theory"
    Explanation: "The document's chapter on Ophelia (conceptually Chapter 4) elaborates on how feminist psychoanalytic readings interpret her madness as a response to patriarchal pressures."

Output as a JSON array of objects, each conforming to the structure described. Ensure IDs are unique.
`,
  config: {
    temperature: 0.35, // Slightly lower for more focused MCQ generation
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
    return { mcqs: [] }; 
  }
);

