
// src/ai/flows/gather-relevant-content.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for gathering relevant content from the internet based on a user prompt and target audience level.
 *
 * - gatherRelevantContent - A function that takes a user prompt and audience level, then returns relevant content.
 * - GatherRelevantContentInput - The input type for the gatherRelevantContent function.
 * - GatherRelevantContentOutput - The return type for the gatherRelevantContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GatherRelevantContentInputSchema = z.object({
  prompt: z.string().describe('The user prompt to gather content for.'),
  audienceLevel: z.string().describe('The target audience level for the content (e.g., High School, Undergraduate, Postgraduate, General Public).'),
});
export type GatherRelevantContentInput = z.infer<typeof GatherRelevantContentInputSchema>;

const SourceSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  url: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A short snippet from the search result.'),
});
export type Source = z.infer<typeof SourceSchema>;

const GatherRelevantContentOutputSchema = z.object({
  content: z.string().describe('The aggregated content from the relevant search results, tailored for the audience.'),
  sources: z.array(SourceSchema).describe('The metadata of the sources used to gather the content (title, URL, snippet).'),
});
export type GatherRelevantContentOutput = z.infer<typeof GatherRelevantContentOutputSchema>;


// Define interfaces for the expected structure of Serper API response
interface SerperOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

async function searchInternet(prompt: string): Promise<Source[]> {
  console.log(`Performing live internet search for: "${prompt}"`);
  
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not set in the environment variables.");
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        q: prompt,
        apiKey: apiKey // Pass API key in the body
      }),
    });

    if (!response.ok) {
       const errorBody = await response.json();
       console.error("Error fetching search results from Serper:", errorBody);
       throw new Error(`Serper API request failed with status: ${response.status} - ${errorBody.message || 'Unknown error'}`);
    }

    const data: SerperResponse = await response.json();

    if (data.organic) {
      return data.organic
              .filter((res): res is Required<SerperOrganicResult> => !!res.title && !!res.link && !!res.snippet) // Ensure essential fields exist
              .map((res) => ({
                title: res.title,
                url: res.link,
                snippet: res.snippet,
              }))
              .slice(0, 10); // Limit to top 10 results
    }
    
    return [];

  } catch (error) {
    console.error("Error during Serper API call:", error);
    // In case of an API error, return an empty array to prevent the flow from crashing.
    return [];
  }
}

export async function gatherRelevantContent(input: GatherRelevantContentInput): Promise<GatherRelevantContentOutput> {
  return gatherRelevantContentFlow(input);
}

const searchResultRelevancePrompt = ai.definePrompt({
  name: 'searchResultRelevancePrompt',
  input: {
    schema: z.object({
      prompt: z.string(),
      audienceLevel: z.string(),
      title: z.string(),
      url: z.string().url(),
      snippet: z.string(),
    }),
  },
  output: {schema: z.object({isRelevant: z.boolean()})},
  prompt: `Given the user prompt: "{{prompt}}" and the target audience level "{{audienceLevel}}", determine if the following search result is relevant for inclusion in educational material on this topic. Consider the source's likely authority, depth, and appropriateness for the specified audience. Return true if it is, and false if it is not.

Title: {{title}}
URL: {{url}}
Snippet: {{snippet}}`,
});

const summarizeContentPrompt = ai.definePrompt({
  name: 'summarizeContentPrompt',
  input: {
    schema: z.object({
      prompt: z.string(),
      audienceLevel: z.string(),
      results: z.array(SourceSchema),
    }),
  },
  output: {schema: z.object({content: z.string()})},
  prompt: `You are a distinguished professor and acclaimed textbook author with decades of experience in creating engaging and comprehensive educational materials. Your current task is to write a detailed and insightful chapter on "{{prompt}}", specifically tailored for an audience at the "{{audienceLevel}}" level.

The content must be of exceptional quality, appropriate for the specified audience. It should:
- Be meticulously researched, drawing upon the provided sources to ensure accuracy, depth, and nuanced understanding suitable for the "{{audienceLevel}}" audience.
- Be written in a clear, formal, and authoritative academic style, adapted in complexity and terminology for the "{{audienceLevel}}" level. For example, content for "High School" should be more accessible than for "Postgraduate".
- Provide profound explanations of key concepts, theories, historical context, and seminal works related to "{{prompt}}", adjusting the depth based on the "{{audienceLevel}}".
- Incorporate illustrative examples, critical analyses, case studies, or analogies that are relevant and understandable to the "{{audienceLevel}}" audience, encouraging critical thinking appropriate for their level.
- Be logically structured with clear headings, subheadings, and coherent paragraphs that flow seamlessly to facilitate deep understanding and learning for the "{{audienceLevel}}". Markdown should be used for formatting (e.g. # Title, ## Subtitle, ### Sub-subtitle, *italic*, **bold**, lists).
- Maintain an objective, scholarly, and engaging tone throughout. Explain any necessary jargon thoroughly, especially for less advanced audiences.
- Synthesize the information from the provided sources into a cohesive, original, and analytical narrative. Do NOT simply rephrase or list snippets from the sources. The goal is to create a new, integrated piece of writing that offers unique insights or perspectives based on the synthesis, tailored for the "{{audienceLevel}}".
- The final output should read as if it's a chapter from a highly respected academic textbook, specifically written for the "{{audienceLevel}}" audience. It should be comprehensive enough to serve as a primary resource for students at this level studying this topic. If the topic is very broad, focus on producing a substantial initial section or chapter that lays a strong foundation.
- Take your time to gather all necessary information from the provided snippets and synthesize it thoughtfully.

Provided Relevant Search Results:
{{#each results}}
Source Title: {{this.title}}
Source URL: {{this.url}}
Source Snippet: {{this.snippet}}
---
{{/each}}

Now, generate the comprehensive textbook chapter based on the topic "{{prompt}}" and these sources, ensuring the content is tailored for an "{{audienceLevel}}" audience. Ensure the content is substantial and thorough. Output the content in Markdown format.`,
});

const gatherRelevantContentFlow = ai.defineFlow(
  {
    name: 'gatherRelevantContentFlow',
    inputSchema: GatherRelevantContentInputSchema,
    outputSchema: GatherRelevantContentOutputSchema,
  },
  async (input: GatherRelevantContentInput) => {
    const rawSearchResults = await searchInternet(input.prompt);

    const relevantSources: Source[] = [];

    for (const result of rawSearchResults) {
      const {output: relevanceOutput} = await searchResultRelevancePrompt({
        prompt: input.prompt,
        audienceLevel: input.audienceLevel,
        title: result.title,
        url: result.url,
        snippet: result.snippet,
      });
      if (relevanceOutput?.isRelevant) {
        relevantSources.push(result);
      }
    }

    if (relevantSources.length === 0) {
      return {
        content: "After reviewing potential sources, none were deemed sufficiently relevant or authoritative to construct a textbook-quality chapter on this specific topic for the specified audience, based on the provided snippets. Please try a different or more specific prompt.",
        sources: [], // No sources used for content generation
      };
    }
    
    const {output: summaryOutput} = await summarizeContentPrompt({
      prompt: input.prompt,
      audienceLevel: input.audienceLevel,
      results: relevantSources,
    });

    return {
      content: summaryOutput?.content ?? 'Could not generate content based on the provided sources.',
      sources: relevantSources,
    };
  }
);
