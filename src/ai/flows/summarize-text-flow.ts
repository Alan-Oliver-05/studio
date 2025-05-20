
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
  keyEntities: z.array(z.string()).optional().describe('Key entities (people, places, organizations) mentioned in the text.'),
  sentiment: z.string().optional().describe('Overall sentiment of the text (e.g., positive, negative, neutral), if discernible.'),
  keywords: z.array(z.string()).optional().describe('Suggested keywords or tags for the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert summarizer and information extractor. Please provide a concise, coherent, and well-structured summary of the following text.
Your response should include:
1.  **Summary**: The main idea or thesis, key arguments or points, critical supporting details or examples, and the overall takeaway or conclusion.
2.  **Key Entities**: Identify key people, places, and organizations mentioned (if any).
3.  **Sentiment**: If the text expresses a clear overall sentiment (e.g., positive, negative, neutral towards the main subject), briefly note it. Otherwise, state "Not clearly discernible".
4.  **Keywords**: Suggest 3-5 relevant keywords or tags for this text.

Ensure the summary is easy to understand and captures the essence of the original content. Avoid jargon where possible and aim for clarity suitable for quick understanding.

Text to analyze:
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
        // Even if other fields are missing, summary is crucial
        console.warn("AI output for summarization was missing the summary field. Output:", JSON.stringify(output));
        throw new Error("Failed to generate summary or summary was empty.");
    }
    return output;
  }
);

