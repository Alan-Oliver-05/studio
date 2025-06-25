
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
    description: 'Fetches the text transcript and metadata (title, author) for a given YouTube video URL. This should be used to get the content of a video for summarization or analysis.',
    inputSchema: z.object({
      videoUrl: z.string().url().describe('The full URL of the YouTube video (e.g., https://www.youtube.com/watch?v=...).'),
    }),
    outputSchema: z.object({
      transcript: z.string().describe('The full text transcript of the video, with each line joined by a space.'),
      title: z.string().optional().describe('The title of the YouTube video.'),
      authorName: z.string().optional().describe('The name of the YouTube channel/author.'),
    }),
  },
  async (input) => {
    let title: string | undefined;
    let authorName: string | undefined;
    try {
      // Fetch oEmbed data for title and author
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(input.videoUrl)}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        title = oembedData.title;
        authorName = oembedData.author_name;
      }
    } catch (e) {
      console.error(`Could not fetch oEmbed data for ${input.videoUrl}:`, e);
      // Non-fatal, continue to get transcript
    }

    try {
      const transcriptParts = await YoutubeTranscript.fetchTranscript(input.videoUrl);
      if (!transcriptParts || transcriptParts.length === 0) {
        return { transcript: "Error: No transcript found for this video. It might be disabled by the creator.", title, authorName };
      }
      const fullTranscript = transcriptParts.map(part => part.text).join(' ');
      return { transcript: fullTranscript, title, authorName };
    } catch (error) {
      console.error(`YouTube Transcript Error for URL ${input.videoUrl}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyError = `Error: An error occurred while fetching the transcript: ${errorMessage}`;
      // Provide a user-friendly error message
      if (errorMessage.includes("disabled")) {
          userFriendlyError = "Error: Could not retrieve transcript. The creator has likely disabled transcripts for this video.";
      }
      if (errorMessage.includes("not a valid YouTube video ID")) {
          userFriendlyError = "Error: Invalid YouTube URL provided. Please check the link.";
      }
      return { transcript: userFriendlyError, title, authorName };
    }
  }
);
