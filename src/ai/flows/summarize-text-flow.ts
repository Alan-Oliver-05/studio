
'use server';
/**
 * @fileOverview A Genkit flow to summarize a given piece of text.
 *
 * - summarizeText - A function that initiates the flow to summarize text.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().min(10, { message: "Text to summarize must be at least 10 characters." }).describe('The text content that needs to be summarized.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The concise summary of the provided text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert summarizer. Please provide a concise, coherent, and well-structured summary of the following text.
Your summary should:
1. Identify the main idea or thesis.
2. Outline key arguments or points.
3. Briefly mention any critical supporting details or examples.
4. Conclude with the overall takeaway or conclusion of the text.
Ensure the summary is easy to understand and captures the essence of the original content. Avoid jargon where possible and aim for clarity suitable for quick understanding.

Text to summarize:
{{{textToSummarize}}}
  `,
  config: {
    temperature: 0.3,
  }
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.summary) {
        throw new Error("Failed to generate summary or summary was empty.");
    }
    return output;
  }
);

