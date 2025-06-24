'use server';
/**
 * @fileOverview A Genkit flow that acts as a planner, breaking down a complex goal into research steps.
 *
 * - plannerFlow - Takes a user goal and returns a list of research queries.
 * - PlannerInput - The input type for the plannerFlow.
 * - PlannerOutput - The return type for the plannerFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { PlannerInput, PlannerOutput } from '@/types';

const PlannerInputSchema = z.object({
  goal: z.string().describe('The user\'s high-level goal or complex question.'),
});

const PlannerOutputSchema = z.object({
    researchQueries: z.array(z.string()).describe('An array of 2-5 specific, targeted search queries that will collectively address the user\'s goal.'),
    reportTitle: z.string().describe('A suitable title for the final report that will be generated based on the research.'),
});


const plannerPrompt = ai.definePrompt({
    name: 'plannerPrompt',
    input: { schema: PlannerInputSchema },
    output: { schema: PlannerOutputSchema },
    prompt: `You are an expert research planner. Your task is to break down a user's complex goal into a series of 2-5 specific, answerable questions that can be used as web search queries. Also, devise a concise title for the final report.

**Important:** First, analyze the user's goal for likely typos (e.g., "stranded" instead of "standard") and base your plan on the corrected, most probable intent.

User's Goal: "{{{goal}}}"

For example, if the user's goal is "Compare React and Vue for web development", your output should be:
{
  "researchQueries": [
    "Key features and architecture of React.js",
    "Key features and architecture of Vue.js",
    "Pros and cons of using React for web development",
    "Pros and cons of using Vue.js for web development",
    "Developer community size and ecosystem for React vs Vue"
  ],
  "reportTitle": "A Comparative Analysis of React.js and Vue.js for Web Development"
}

Based on the user's goal, generate the list of research queries and a report title.
`,
});


export async function plannerFlow(input: PlannerInput): Promise<PlannerOutput> {
    try {
      const { output } = await plannerPrompt(input);
      if (!output || !output.researchQueries || output.researchQueries.length === 0) {
        throw new Error('The AI planner failed to generate a valid research plan. The goal may be too ambiguous.');
      }
      return output;
    } catch (err) {
       console.error("Error in plannerFlow:", err);
       let errorMessage = err instanceof Error ? err.message : String(err);
       
       if (errorMessage.includes("API_KEY_SERVICE_BLOCKED") || errorMessage.includes("generativelanguage.googleapis.com")) {
          errorMessage = `The AI model request was blocked. This is almost always because the "Vertex AI API" is not enabled in your Google Cloud project. Please go to your project's "Enabled APIs & services" page and ensure "Vertex AI API" is active. Also, check for any API key restrictions as described in HOW_TO_GET_KEYS.md.`;
       } else if (errorMessage.includes("API key not valid")) {
          errorMessage = `The provided Google API Key is not valid. Please double-check your .env file and ensure it is correct.`
       }

       // Re-throw a more user-friendly error that can be caught by the UI
       throw new Error(`The planning phase failed. Reason: ${errorMessage}`);
    }
}
