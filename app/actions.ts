
"use server";

import { gatherRelevantContent, type GatherRelevantContentInput, type GatherRelevantContentOutput } from '@/ai/flows/gather-relevant-content';
import { continueContent, type ContinueContentInput, type ContinueContentOutput } from '@/ai/flows/continue-content-flow';
import { generateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';
import { grammarCheck, type GrammarCheckInput, type GrammarCheckOutput } from '@/ai/flows/grammar-check-flow';

export async function handleGatherContent(
  input: GatherRelevantContentInput
): Promise<GatherRelevantContentOutput | { error: string }> {
  try {
    if (!input.prompt || input.prompt.length < 3 || input.prompt.length > 500) {
        return { error: "Prompt must be between 3 and 500 characters." };
    }
    if (!input.audienceLevel) {
        return { error: "Audience level must be selected."}
    }
    
    const result = await gatherRelevantContent(input);
    return result;
  } catch (e) {
    console.error("Detailed error gathering content in server action:", e);
    // Return a generic error message to the client
    return { error: "An error occurred while gathering content. Please check server logs for details." };
  }
}

export async function handleContinueContent(
  input: ContinueContentInput
): Promise<ContinueContentOutput | { error: string }> {
  try {
    if (!input.originalPrompt || input.originalPrompt.length < 3 || input.originalPrompt.length > 500) {
      return { error: "Original prompt is invalid." };
    }
    if (!input.audienceLevel) {
      return { error: "Audience level is missing." };
    }
    if (!input.existingContent) {
      return { error: "Existing content is missing." };
    }
    
    const result = await continueContent(input);
    return result;
  } catch (e) {
    console.error("Detailed error continuing content generation in server action:", e);
    return { error: "An error occurred while continuing content generation. Please check server logs for details." };
  }
}

export async function handleGenerateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput | { error: string }> {
  try {
    if (!input.prompt || input.prompt.length < 3 || input.prompt.length > 200) {
        return { error: "Image generation prompt must be between 3 and 200 characters." };
    }
    const result = await generateImage(input);
    // Check if the placeholder for failure was returned
    if (result.imageDataUri === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') {
        return { error: result.accompanyingText || "Image generation failed, but no specific error text was returned."}
    }
    return result;
  } catch (e) {
    console.error("Detailed error generating image in server action:", e);
    return { error: "An error occurred while generating the image. Please check server logs for details." };
  }
}

export async function handleGrammarCheck(
  input: GrammarCheckInput
): Promise<GrammarCheckOutput | { error: string }> {
  try {
    if (!input.textToCheck || input.textToCheck.trim().length === 0) {
      return { error: "No text provided for grammar check." };
    }
    const result = await grammarCheck(input);
    return result;
  } catch (e) {
    console.error("Detailed error during grammar check in server action:", e);
    return { error: "An error occurred during grammar check. Please check server logs for details." };
  }
}
    