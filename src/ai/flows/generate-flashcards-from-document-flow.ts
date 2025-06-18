'use server';
/**
 * @fileOverview Generates conceptual flashcards based on a document's name and type, simulating RAG.
 *
 * - generateFlashcardsFromDocument - A function that generates flashcards.
 * - GenerateFlashcardsInput - The input type for the function.
 * - GenerateFlashcardsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DocumentFileCategory } from '@/types';

const GenerateFlashcardsInputSchema = z.object({
  documentName: z.string().min(3, {message: "Document name must be at least 3 characters."}).describe('The name of the "uploaded" document.'),
  documentType: z.enum(['pdf', 'docx', 'audio', 'slides', 'unknown']).describe('The type of the "uploaded" document.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  id: z.string().describe("A unique ID for the flashcard."),
  front: z.string().describe('The front side of the flashcard (e.g., a specific question, key term, or granular concept from the document).'),
  back: z.string().describe('The back side of the flashcard (e.g., the detailed answer, precise definition, or in-depth explanation as if extracted from the document).'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards, reflecting specific details conceptually found in the document.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcardsFromDocument(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsFromDocumentPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an AI expert acting as a Retrieval Augmented Generation (RAG) agent for creating highly specific flashcards.
Imagine you have thoroughly read and analyzed the document titled '{{{documentName}}}', which is a '{{{documentType}}}' file.
Your task is to generate 5-7 flashcards that reflect **specific details, key definitions, nuanced concepts, or important data points** you would expect to find *within such a document*.
Avoid overly generic flashcards. Instead, focus on creating questions and answers that seem like they were extracted directly from the document's text.

For example:
- If documentName is "Advanced_Quantum_Physics_Chapter3.pdf" (pdf), a flashcard might be:
    Front: "Explain the EPR paradox in the context of quantum entanglement as discussed in the chapter."
    Back: "The EPR paradox, as detailed on page 12, highlights the apparent contradiction between quantum mechanics and local realism, where measurements on one entangled particle instantaneously influence another, regardless of distance. The chapter explores Bell's theorem as a resolution..."
- If documentName is "Minutes_Project_Alpha_Meeting_June_2024.docx" (docx), a flashcard might be:
    Front: "What was the key decision regarding the marketing budget for Q3 during the Project Alpha June meeting?"
    Back: "Item 4.2 of the minutes indicates that the marketing budget for Q3 was approved at $50,000, with a focus on digital channels, following a proposal by Jane Doe."
- If documentName is "Lecture_On_Mitochondrial_Respiration.pptx" (slides), a flashcard might be:
    Front: "List the four main complexes involved in the electron transport chain as presented on slide 7."
    Back: "Slide 7 outlines the four main complexes: Complex I (NADH dehydrogenase), Complex II (succinate dehydrogenase), Complex III (cytochrome bc1 complex), and Complex IV (cytochrome c oxidase)."

Each flashcard must have an 'id' (unique string), a 'front' (highly specific question or term), and a 'back' (detailed answer/explanation as if from the document).
Output the flashcards as a JSON array of objects. Ensure IDs are unique.
`,
  config: {
    temperature: 0.4, // Balance specificity with some plausible generation
  }
});

const generateFlashcardsFromDocumentFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFromDocumentFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (output && Array.isArray(output.flashcards)) {
      return {
        flashcards: output.flashcards.map((card, index) => ({
          ...card,
          id: card.id || `flashcard-${Date.now()}-${index}`
        }))
      };
    }
    console.warn("AI output for flashcards was malformed or missing. Input was:", JSON.stringify(input));
    return { flashcards: [] }; 
  }
);

