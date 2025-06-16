"use server";

import { gatherRelevantContent, type GatherRelevantContentInput, type GatherRelevantContentOutput } from '@/ai/flows/gather-relevant-content';
import { continueContent, type ContinueContentInput, type ContinueContentOutput } from '@/ai/flows/continue-content-flow';

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
    console.error("Error gathering content in server action:", e);
    if (e instanceof Error) {
        return { error: "Failed to process your request. Please try again later. Details: " + e.message };
    }
    return { error: "An unexpected error occurred while gathering content. Please try again." };
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
    // Sources can be an empty array, so no specific validation here unless required.

    const result = await continueContent(input);
    return result;
  } catch (e) {
    console.error("Error continuing content generation in server action:", e);
    if (e instanceof Error) {
      return { error: "Failed to continue content generation. Please try again later. Details: " + e.message };
    }
    return { error: "An unexpected error occurred while continuing content generation. Please try again." };
  }
}
