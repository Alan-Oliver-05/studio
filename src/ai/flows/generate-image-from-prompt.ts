
'use server';
/**
 * @fileOverview Generates an image from a text prompt using an AI model.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns an image data URI.
 * - GenerateImageInput - The input type for the generateImageFromPrompt function.
 * - GenerateImageOutput - The return type for the generateImageFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI (e.g., data:image/png;base64,...).'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  console.log(`Attempting to generate image with prompt: "${input.prompt}"`);
  try {
    return await generateImageFromPromptFlow(input);
  } catch (error) {
    console.error(`High-level error in generateImageFromPrompt for prompt "${input.prompt}":`, error instanceof Error ? error.message : error);
    // Rethrow a more specific error or the original one
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

const generateImageFromPromptFlow = ai.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    if (!input.prompt || input.prompt.trim() === "") {
      console.error("Image generation attempted with an empty prompt.");
      throw new Error("Cannot generate an image from an empty prompt.");
    }

    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Specific model for image generation
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
          safetySettings: [ 
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (media && media.url) {
        console.log(`Successfully generated image for prompt: "${input.prompt}"`);
        return { imageDataUri: media.url };
      } else {
        console.warn(`Image generation for prompt: "${input.prompt}" did not return media URL. Media object:`, JSON.stringify(media, null, 2));
        throw new Error(`Image generation succeeded but no media URL was returned. Prompt: "${input.prompt}". This might be due to safety filters or an issue with the model's output.`);
      }
    } catch (flowError) {
      console.error(`Error during generateImageFromPromptFlow execution for prompt "${input.prompt}":`, flowError instanceof Error ? flowError.message : flowError);
      
      let errorMessage = `Image generation failed for prompt: "${input.prompt}".`;
      if (flowError instanceof Error) {
        errorMessage += ` Details: ${flowError.message}`;
      } else {
        errorMessage += ` Details: ${String(flowError)}`;
      }
      throw new Error(errorMessage);
    }
  }
);
