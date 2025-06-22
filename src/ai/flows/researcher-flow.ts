'use server';
/**
 * @fileOverview A Genkit flow that acts as a researcher, using a web search tool to gather information.
 *
 * - researcherFlow - Takes a query, uses the web search tool, and returns a summary.
 * - ResearcherInput - The input type for the researcherFlow.
 * - ResearcherOutput - The return type for the researcherFlow.
 */

import { performWebSearch } from '@/ai/tools/web-search-tool';
import type { ResearcherInput, ResearcherOutput } from '@/types';

export async function researcherFlow(input: ResearcherInput): Promise<ResearcherOutput> {
  const { searchResultsSummary } = await performWebSearch({ query: input.query });
  return { researchSummary: searchResultsSummary };
}
