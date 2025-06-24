
'use server';
/**
 * @fileOverview A Genkit flow that acts as a writer, composing a comprehensive response based on provided research notes.
 *
 * - writerFlow - Takes research notes and a user goal, then writes a response.
 * - WriterInput - The input type for the writerFlow.
 * - WriterOutput - The return type for the writerFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { WriterInput, WriterOutput } from '@/types';

const WriterInputSchema = z.object({
  goal: z.string().describe('The original user goal or complex question.'),
  researchNotes: z.string().describe('A compilation of research notes gathered to address the goal.'),
});

const WriterOutputSchema = z.object({
  writtenResponse: z.string().describe('The final, comprehensive written response that addresses the user\'s goal, formatted in Markdown.'),
});


const writerPrompt = ai.definePrompt({
    name: 'writerPrompt',
    input: { schema: WriterInputSchema },
    output: { schema: WriterOutputSchema },
    prompt: `You are an expert writer and analyst. Your task is to synthesize the provided research notes into a single, well-structured, and comprehensive response that directly addresses the user's original goal.

User's Goal: "{{{goal}}}"

Research Notes (This is the source of truth for your response):
---
{{{researchNotes}}}
---

Based *only* on the information in the research notes, please generate a clear and well-organized response in Markdown format.
`,
});


export async function writerFlow(input: WriterInput): Promise<WriterOutput> {
    try {
        const { output } = await writerPrompt(input);
        if (!output || !output.writtenResponse) {
          throw new Error('The writer AI failed to generate a response from the research notes.');
        }
        return output;
    } catch (err) {
        console.error("Error in writerFlow:", err);
        let errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.includes("API_KEY_SERVICE_BLOCKED") || (errorMessage.includes("403") && errorMessage.includes("generativelanguage.googleapis.com"))) {
            errorMessage = `The AI model request was blocked. This is almost always because the "Vertex AI API" is not enabled in your Google Cloud project. Please go to your project's "Enabled APIs & services" page and ensure "Vertex AI API" is active. See Step 4 in HOW_TO_GET_KEYS.md.`;
        } else if (errorMessage.includes("API key not valid")) {
            errorMessage = `The provided Google API Key is not valid. Please double-check your .env file and the key in your Google Cloud Console.`;
        } else if (errorMessage.includes("PERMISSION_DENIED")) {
           errorMessage = `The AI model request was denied. This is likely due to API key restrictions. Please check Step 6 in HOW_TO_GET_KEYS.md to ensure your API key has no application or API restrictions.`
       }
        // Re-throw a more user-friendly error
        throw new Error(`The writing phase failed. Reason: ${errorMessage}`);
    }
}
