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
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Re-throw a more user-friendly error
        throw new Error(`The writing phase failed. This could be due to an API access issue or a problem with the AI response. Original error: ${errorMessage}`);
    }
}
