
'use server';
/**
 * @fileOverview A Genkit flow for continuing the generation of textbook content.
 *
 * - continueContent - A function that takes existing content, original prompt, audience, and sources, then returns a continuation.
 * - ContinueContentInput - The input type for the continueContent function.
 * - ContinueContentOutput - The return type for the continueContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Re-using SearchResultSchema structure for sources, though only URL is strictly needed here.
// It's kept for consistency if more source details were to be used in continuation.
const SourceSchema = z.object({
  title: z.string().describe('The title of the source.'),
  url: z.string().url().describe('The URL of the source.'),
  snippet: z.string().describe('A short snippet from the source.'),
});

const ContinueContentInputSchema = z.object({
  originalPrompt: z.string().describe('The initial user prompt for the content.'),
  audienceLevel: z.string().describe('The target audience level for the content.'),
  existingContent: z.string().describe('The content that has already been generated.'),
  sources: z.array(SourceSchema).describe('The list of sources used for the initial content generation. These provide context but should not be re-summarized unless new aspects are being drawn from them for continuation.'),
});
export type ContinueContentInput = z.infer<typeof ContinueContentInputSchema>;

const ContinueContentOutputSchema = z.object({
  continuedContent: z.string().describe('The newly generated content chunk, meant to follow the existing content.'),
});
export type ContinueContentOutput = z.infer<typeof ContinueContentOutputSchema>;

export async function continueContent(input: ContinueContentInput): Promise<ContinueContentOutput> {
  return continueContentFlow(input);
}

const continueContentPrompt = ai.definePrompt({
  name: 'continueContentPrompt',
  input: {schema: ContinueContentInputSchema},
  output: {schema: ContinueContentOutputSchema},
  prompt: `You are a distinguished professor and acclaimed textbook author, continuing the task of writing a detailed and insightful textbook chapter.

Original Topic: "{{originalPrompt}}"
Target Audience Level: "{{audienceLevel}}"

The chapter so far reads:
--- EXISTING CONTENT START ---
{{{existingContent}}}
--- EXISTING CONTENT END ---

You have previously consulted the following sources:
{{#each sources}}
- {{this.title}} ({{this.url}})
{{/each}}

Your task is to SEAMLESSLY CONTINUE writing this chapter.
- DO NOT repeat any information or sections already present in the "EXISTING CONTENT".
- DO NOT start with introductory phrases like "Continuing from the previous text..." or "In this next section...". Simply write the next part of the chapter as if it flows directly from the existing content.
- Introduce new sub-topics, elaborate on points previously made, or provide further examples, critical analyses, or case studies relevant to the "{{originalPrompt}}" and appropriate for the "{{audienceLevel}}".
- Maintain the same formal, authoritative academic style, depth, and complexity suitable for the "{{audienceLevel}}".
- Ensure logical structure and coherence with the existing content.
- If the existing content seems to end mid-thought or mid-section, complete it naturally before moving to new material.
- If the existing content concludes a major section, begin a new major section with an appropriate heading (e.g., using Markdown like ## New Section Title).
- The goal is to produce a substantial addition to the chapter.

Now, generate the next portion of the textbook chapter based on these instructions. Output only the new content.`,
});

const continueContentFlow = ai.defineFlow(
  {
    name: 'continueContentFlow',
    inputSchema: ContinueContentInputSchema,
    outputSchema: ContinueContentOutputSchema,
  },
  async (input: ContinueContentInput) => {
    const {output} = await continueContentPrompt(input);
    return {
      continuedContent: output?.continuedContent ?? 'Could not generate continued content.',
    };
  }
);
