
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

async function searchGoogle(query: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return "Error: Web search is not configured. Your GOOGLE_API_KEY is missing. Please see HOW_TO_GET_KEYS.md for instructions.";
  }
  
  if (!cseId || cseId === "YOUR_SEARCH_ENGINE_ID_HERE") {
    return "Error: Web search is not configured. Your GOOGLE_CSE_ID is missing. Please see HOW_TO_GET_KEYS.md for instructions.";
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // Handle API errors from the response body
      const error = data.error || { message: `HTTP error! status: ${response.status}` };
      console.error(`Google Search API error for query "${query}":`, error);

      if (error.message.includes("API key not valid")) {
        return `Error: The provided Google API Key is not valid. Please check your .env file.`;
      }
      if (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("forbidden") || error.message.toLowerCase().includes("custom search api has not been used")) {
        return `Error: API request was blocked due to a permission issue. Please ensure the "Custom Search API" is enabled in your Google Cloud project and that your API key is configured correctly. See Step 4 in HOW_TO_GET_KEYS.md for details.`;
      }
      if (error.message.toLowerCase().includes("invalid value") && error.details?.[0]?.field === 'cx') {
        return `Error: The provided Google Custom Search Engine ID (CSE ID) is invalid. Please check your .env file.`;
      }
      
      return `An error occurred while searching the web: ${error.message}`;
    }

    const items = data.items;
    if (!items || items.length === 0) {
      return `No results found for "${query}".`;
    }

    // Format the results into a readable summary for the writer AI
    const searchSummary = items
      .map((item: any) => `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}\n---`)
      .join('\n\n');

    return searchSummary;
  } catch (error) {
    console.error(`Network or fetch error for query "${query}":`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `An error occurred while searching the web: ${errorMessage}`;
  }
}

export const performWebSearch = ai.defineTool(
  {
    name: 'performWebSearch',
    description: 'Performs a real-time web search using the Google Custom Search API to find up-to-date information. It returns a summary of the key information (titles and snippets) from the top search results.',
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
