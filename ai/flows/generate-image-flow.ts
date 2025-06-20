
'use server';
/**
 * @fileOverview A Genkit flow for generating an image based on a text prompt.
 *
 * - generateImage - A function that takes a text prompt and returns an image data URI.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image for.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().url().describe('The generated image as a data URI.'),
  // We include a text field because the image generation model requires responseModalities: ['TEXT', 'IMAGE']
  // and will always return some text.
  accompanyingText: z.string().optional().describe('Any accompanying text returned by the model.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input: GenerateImageInput) => {
    try {
      const {media, text} = await ai.generate({
        // IMPORTANT: Use the specific model for image generation.
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a high-quality, visually appealing image that is highly relevant to the following topic: "${input.prompt}". The style should be photorealistic or a detailed illustration, suitable for a textbook or educational material. Ensure the image is safe for all audiences and does not contain any text. The image should have an aspect ratio of 16:9.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
           safetySettings: [ 
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (media && media.url) {
        return { imageDataUri: media.url, accompanyingText: text ?? undefined };
      } else {
        console.error('Image generation did not return a media URL. Accompanying text:', text);
        return { 
          imageDataUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Transparent 1x1 pixel GIF
          accompanyingText: `Failed to generate image. Model response: ${text || 'No additional details.'}` 
        };
      }
    } catch (error)
    {
      console.error("Error in generateImageFlow:", error);
      let errorMessage = "Error during image generation.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { 
        imageDataUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 
        accompanyingText: `Error during image generation: ${errorMessage}`
      };
    }
  }
);
