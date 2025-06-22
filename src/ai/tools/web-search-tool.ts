
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';

const customsearch = google.customsearch('v1');

async function searchGoogle(query: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.error("GOOGLE_API_KEY or GOOGLE_CSE_ID is not set in .env file.");
    // Return a helpful error message that will be displayed in the UI.
    return "Web search is not configured. Please set GOOGLE_API_KEY and GOOGLE_CSE_ID in the .env file. See HOW_TO_GET_KEYS.md for instructions.";
  }

  try {
    const res = await customsearch.cse.list({
      auth: apiKey,
      cx: cseId,
      q: query,
      num: 5, // Request top 5 results
    });

    const items = res.data.items;
    if (!items || items.length === 0) {
      return `No results found for "${query}".`;
    }

    // Format the results into a readable summary for the writer AI
    const searchSummary = items
      .map(item => `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}\n---`)
      .join('\n\n');

    return searchSummary;
  } catch (error) {
    console.error(`Google Search API error for query "${query}":`, error);
    // Provide a descriptive error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("API key not valid")) {
      return `Error: The provided Google API Key is not valid. Please check your .env file.`;
    }
    if (errorMessage.includes("invalid Custom Search Engine ID")) {
       return `Error: The provided Google Custom Search Engine ID (CSE ID) is invalid. Please check your .env file.`;
    }
    return `An error occurred while searching the web: ${errorMessage}`;
  }
}

export const performWebSearch = ai.defineTool(
  {
    name: 'performWebSearch',
    description: 'Performs a real-time web search using the Google Custom Search API to find up-to-date information. It returns a summary of the top search results.',
    inputSchema: z.object({
      query: z.string().describe('The specific search query to use for the web search.'),
    }),
    outputSchema: z.object({
      searchResultsSummary: z.string().describe('A formatted summary of the key information (titles and snippets) from the top search results.'),
    }),
  },
  async (input) => {
    const summary = await searchGoogle(input.query);
    return { searchResultsSummary: summary };
  }
);
