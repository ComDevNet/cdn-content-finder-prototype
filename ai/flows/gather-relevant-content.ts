
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

const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  url: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A short snippet from the search result.'),
  isRelevant: z.boolean().describe('Whether the search result is relevant to the user prompt and audience level.'),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;


const GatherRelevantContentOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe('An array of relevant search results, including their relevance assessment.'),
  content: z.string().describe('The aggregated content from the relevant search results, tailored for the audience.'),
  sources: z.array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        snippet: z.string(),
      })
  ).describe('The metadata of the sources used to gather the content (title, URL, snippet).'),
});

export type GatherRelevantContentOutput = z.infer<typeof GatherRelevantContentOutputSchema>;

// IMPORTANT: This function currently returns DUMMY data and simulates an internet search.
// For a production application, you MUST replace this with a real internet search tool.
// This could involve:
// 1. Implementing a Genkit tool that calls a search engine API (e.g., Google Custom Search API, Bing Search API, Serper API, etc.).
// 2. Using a web scraping solution (be mindful of terms of service and ethical considerations).
// The tool should be designed to fetch and return relevant search results
// based on the user's prompt. The URLs returned should be actual URLs from the search.
// The quality and quantity of "gathering all needed resources" heavily depends on this real implementation.
async function searchInternet(prompt: string): Promise<{
  title: string;
  link: string;
  snippet: string;
}[]> {
  console.log(`Simulating internet search for: "${prompt}"`);
  // Placeholder for internet search functionality.
  // In a real application, this would use a search engine API.
  // For now, return some varied dummy data to illustrate.
  if (prompt.toLowerCase().includes("history of rome")) {
    return Promise.resolve([
      {
        title: 'The Roman Empire: A Brief Overview - History.com',
        link: 'https://www.history.com/topics/ancient-rome/roman-empire',
        snippet: 'Explore the rise and fall of the Roman Empire, from its mythical founding to its eventual decline. Key figures, major events, and lasting legacy.',
      },
      {
        title: 'Ancient Rome - Wikipedia',
        link: 'https://en.wikipedia.org/wiki/Ancient_Rome',
        snippet: 'Ancient Rome was a civilization that grew from a small agricultural community founded on the Italian Peninsula in the 10th to 8th centuries BC.',
      },
      {
        title: 'Daily Life in Ancient Rome - World History Encyclopedia',
        link: 'https://www.worldhistory.org/Rome/',
        snippet: 'Details on housing, food, entertainment, and social structure in ancient Rome, providing a glimpse into the lives of its citizens.',
      },
       {
        title: 'SPQR: A History of Ancient Rome by Mary Beard - Book Review',
        link: 'https://www.theguardian.com/books/2015/oct/22/spqr-a-history-of-ancient-rome-mary-beard-review',
        snippet: 'A review of Mary Beard\'s comprehensive history of ancient Rome, highlighting its narrative style and scholarly depth.',
      },
    ]);
  }
  if (prompt.toLowerCase().includes("quantum computing")) {
    return Promise.resolve([
      {
        title: 'Quantum Computing: Principles and Applications - MIT Technology Review',
        link: 'https://www.technologyreview.com/topics/computing/quantum-computing/',
        snippet: 'An in-depth exploration of the fundamental principles of quantum computing, its potential applications, and current challenges in the field.',
      },
      {
        title: 'NIST Quantum Information Science Portal',
        link: 'https://www.nist.gov/quantum-information-science',
        snippet: 'Official resources from the National Institute of Standards and Technology on quantum algorithms, cryptography, and metrology.',
      },
      {
        title: 'Introduction to Quantum Mechanics - Stanford Encyclopedia of Philosophy',
        link: 'https://plato.stanford.edu/entries/qm/',
        snippet: 'A philosophical and theoretical overview of quantum mechanics, the basis for quantum computing.',
      },
    ]);
  }
  // Generic dummy data for other prompts
  return Promise.resolve([
    {
      title: `Exploring ${prompt}: An Academic Perspective - ResearchGate`,
      link: `https://www.researchgate.net/publication/fake-doc-id-${prompt.replace(/\s+/g, '_').toLowerCase()}`,
      snippet: `This paper provides a detailed analysis of ${prompt}, covering its historical context, current understanding, and future implications. Includes peer-reviewed references.`,
    },
    {
      title: `${prompt} in Context: A University Course Reader - OpenStax`,
      link: `https://openstax.org/books/introductory-${prompt.replace(/\s+/g, '-').toLowerCase()}/pages/introduction`,
      snippet: `An introductory chapter from an open educational resource on ${prompt}, designed for undergraduate students. Explains fundamental concepts clearly.`,
    },
    {
      title: `Advanced Topics in ${prompt} - Journal of Specialized Studies`,
      link: `https://www.jstor.org/stable/search?query=${encodeURIComponent(prompt)}`,
      snippet: `A collection of scholarly articles discussing advanced research and complex theories related to ${prompt}, suitable for postgraduate and expert audiences.`,
    },
    {
      title: `Understanding ${prompt} for Everyone - Khan Academy`,
      link: `https://www.khanacademy.org/science/tags/${prompt.replace(/\s+/g, '-').toLowerCase()}`,
      snippet: `Accessible explanations and examples of ${prompt}, aimed at high school students and the general public to foster a basic understanding.`,
    }
  ]);
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
      results: z.array(SearchResultSchema.omit({ isRelevant: true })), // isRelevant is not needed for summarization
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

    const evaluatedResults: SearchResult[] = [];
    const summarizationInputs: { title: string; url: string; snippet: string }[] = [];


    for (const result of rawSearchResults) {
      const {output: relevanceOutput} = await searchResultRelevancePrompt({
        prompt: input.prompt,
        audienceLevel: input.audienceLevel,
        title: result.title,
        url: result.link,
        snippet: result.snippet,
      });
      const isRelevant = relevanceOutput?.isRelevant ?? false;
      evaluatedResults.push({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        isRelevant: isRelevant,
      });
      if (isRelevant) {
        summarizationInputs.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet,
        });
      }
    }

    if (summarizationInputs.length === 0) {
      return {
        results: evaluatedResults,
        content: "After reviewing potential sources, none were deemed sufficiently relevant or authoritative to construct a textbook-quality chapter on this specific topic for the specified audience, based on the provided snippets. Please try a different or more specific prompt, or ensure the search tool can access a wider range of academic sources.",
        sources: [], // No sources used for content generation
      };
    }
    
    const {output: summaryOutput} = await summarizeContentPrompt({
      prompt: input.prompt,
      audienceLevel: input.audienceLevel,
      results: summarizationInputs,
    });

    // The 'sources' in the output should be the ones actually used for summarization.
    const usedSourcesForOutput = summarizationInputs.map(s => ({title: s.title, url: s.url, snippet: s.snippet }));

    return {
      results: evaluatedResults, // All evaluated results, including non-relevant ones for transparency
      content: summaryOutput?.content ?? 'Could not generate content based on the provided sources.',
      sources: usedSourcesForOutput,
    };
  }
);
