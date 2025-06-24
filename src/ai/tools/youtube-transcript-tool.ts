
'use server';
/**
 * @fileOverview A Genkit tool to fetch the transcript of a YouTube video.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';

export const getYouTubeTranscript = ai.defineTool(
  {
    name: 'getYouTubeTranscript',
    description: 'Fetches the text transcript for a given YouTube video URL. This should be used to get the content of a video for summarization or analysis.',
    inputSchema: z.object({
      videoUrl: z.string().url().describe('The full URL of the YouTube video (e.g., https://www.youtube.com/watch?v=...).'),
    }),
    outputSchema: z.object({
      transcript: z.string().describe('The full text transcript of the video, with each line joined by a space.'),
    }),
  },
  async (input) => {
    try {
      const transcriptParts = await YoutubeTranscript.fetchTranscript(input.videoUrl);
      if (!transcriptParts || transcriptParts.length === 0) {
        return { transcript: "Error: No transcript found for this video. It might be disabled by the creator." };
      }
      const fullTranscript = transcriptParts.map(part => part.text).join(' ');
      return { transcript: fullTranscript };
    } catch (error) {
      console.error(`YouTube Transcript Error for URL ${input.videoUrl}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Provide a user-friendly error message
      if (errorMessage.includes("disabled")) {
          return { transcript: "Error: Could not retrieve transcript. The creator has likely disabled transcripts for this video." };
      }
      if (errorMessage.includes("not a valid YouTube video ID")) {
          return { transcript: "Error: Invalid YouTube URL provided. Please check the link." };
      }
      return { transcript: `Error: An error occurred while fetching the transcript: ${errorMessage}` };
    }
  }
);
