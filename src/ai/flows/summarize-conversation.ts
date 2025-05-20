
'use server';

/**
 * @fileOverview Summarizes a conversation between a student and the AI tutor.
 *
 * - summarizeConversation - A function that summarizes the conversation.
 * - SummarizeConversationInput - The input type for the summarizeConversation function.
 * - SummarizeConversationOutput - The return type for the summarizeConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeConversationInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The full conversation history between the student and the AI tutor.'),
});
export type SummarizeConversationInput = z.infer<typeof SummarizeConversationInputSchema>;

const SummarizeConversationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation.'),
});
export type SummarizeConversationOutput = z.infer<typeof SummarizeConversationOutputSchema>;

export async function summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {schema: SummarizeConversationInputSchema},
  output: {schema: SummarizeConversationOutputSchema},
  prompt: `You are an AI assistant helping a student review their study session.
  Could you please provide a concise summary of the following conversation, highlighting the main points discussed?

  {{{conversationHistory}}}
  `,
});

const summarizeConversationFlow = ai.defineFlow(
  {
    name: 'summarizeConversationFlow',
    inputSchema: SummarizeConversationInputSchema,
    outputSchema: SummarizeConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.summary) {
        return output;
    }
    console.warn("SummarizeConversation: AI output was malformed or missing summary. Input:", JSON.stringify(input));
    return { summary: "Could not generate a summary for this conversation at the moment." };
  }
);


    