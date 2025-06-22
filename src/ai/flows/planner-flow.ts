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
    const { output } = await plannerPrompt(input);
    if (!output) {
      throw new Error('The planner AI failed to generate a research plan.');
    }
    return output;
}
