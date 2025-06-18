
'use server';
/**
 * @fileOverview A Genkit flow to summarize a given piece of text, acting like a RAG agent.
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
  summary: z.string().describe('A highly detailed and specific summary, as if extracted directly from the core arguments of the text. It should cover the main purpose, key arguments/findings, critical data points or examples, and overall conclusions.'),
  keyEntities: z.array(z.string()).optional().describe('Precisely identified key people, places, organizations, and core concepts mentioned in the text.'),
  sentiment: z.string().optional().describe('Overall sentiment of the text (e.g., positive, negative, neutral towards its main subject), based on nuanced language analysis. State "Not clearly discernible" if truly ambiguous.'),
  keywords: z.array(z.string()).optional().describe('A list of 3-5 highly relevant keywords or tags that capture the essence of the specific details in the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert AI analyst acting as a Retrieval Augmented Generation (RAG) agent. You have thoroughly read and deeply understood the following text.
Your task is to provide a meticulous analysis and summary.

Text to analyze:
{{{textToSummarize}}}

Based on your in-depth understanding of THIS SPECIFIC text, provide:
1.  **Summary**: A comprehensive summary that meticulously covers:
    *   The main purpose or thesis of the text.
    *   The key arguments, findings, or critical sections.
    *   Important data points, specific examples, or crucial evidence presented.
    *   The overall conclusions or most significant takeaways *as if these were directly extracted or synthesized from the text itself*. Avoid generic statements.
2.  **Key Entities**: Identify and list the most important people, places, organizations, and core concepts *explicitly mentioned or central to the text*.
3.  **Sentiment**: Analyze the nuanced language to determine the overall sentiment (e.g., positive, negative, neutral) of the text concerning its main subject. If the sentiment is mixed or not clearly discernible, state that.
4.  **Keywords**: Suggest 3-5 highly specific keywords or tags that precisely reflect the core themes and details discussed *within this text*.

Present this information in a clear, organized manner. Your output must be structured according to the defined JSON schema.
  `,
  config: {
    temperature: 0.2, 
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
        console.warn("AI output for summarization was missing the summary field. Output:", JSON.stringify(output));
        throw new Error("Failed to generate summary or summary was empty.");
    }
    output.keyEntities = output.keyEntities || [];
    output.keywords = output.keywords || [];
    return output;
  }
);
