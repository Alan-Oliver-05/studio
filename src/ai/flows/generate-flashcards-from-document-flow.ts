
'use server';
/**
 * @fileOverview Generates conceptual flashcards based on a document's name and type.
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
  front: z.string().describe('The front side of the flashcard (e.g., a question, term, or concept).'),
  back: z.string().describe('The back side of the flashcard (e.g., the answer, definition, or explanation).'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcardsFromDocument(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsFromDocumentPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an AI expert at creating flashcards from various document types.
The user has provided a file named '{{{documentName}}}' which is a '{{{documentType}}}' document.
Although you cannot see the actual content, generate 5-7 high-quality, conceptually relevant flashcards that would typically be derived from such a document.
Each flashcard must have an 'id' (unique string), a 'front' (a question, term, or concept), and a 'back' (the answer, definition, or detailed explanation).
Focus on key information one might find in a document of this nature.

For example:
- If documentName is "Photosynthesis_Lecture.pptx" (slides), create flashcards about key photosynthesis concepts like "What is chlorophyll?", "Inputs of Photosynthesis", etc.
- If documentName is "Chapter1_History_Rome.docx" (docx), create flashcards about early Roman history.
- If documentName is "Introduction_To_Machine_Learning.pdf" (pdf), create flashcards about basic ML terms and concepts.
- If documentName is "Economics_Lecture_Supply_Demand.mp3" (audio), create flashcards about supply and demand principles.

Output the flashcards as a JSON array of objects, where each object has "id", "front", and "back" string properties. Ensure IDs are unique.
`,
  config: {
    temperature: 0.5, // Allow for some creativity while staying focused
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
      // Ensure IDs are unique if AI doesn't provide them or makes them non-unique
      return {
        flashcards: output.flashcards.map((card, index) => ({
          ...card,
          id: card.id || `flashcard-${Date.now()}-${index}`
        }))
      };
    }
    console.warn("AI output for flashcards was malformed or missing. Input was:", JSON.stringify(input));
    return { flashcards: [] }; // Fallback
  }
);
