
'use server';
/**
 * @fileOverview A Genkit flow for checking grammar and style of a given text.
 *
 * - grammarCheck - A function that takes text and returns grammar/style suggestions.
 * - GrammarCheckInput - The input type for the grammarCheck function.
 * - GrammarCheckOutput - The return type for the grammarCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GrammarCheckInputSchema = z.object({
  textToCheck: z.string().describe('The text content to be checked for grammar and style.'),
});
export type GrammarCheckInput = z.infer<typeof GrammarCheckInputSchema>;

const GrammarSuggestionSchema = z.object({
  issue: z.string().describe("A description of the identified grammatical error, awkward phrasing, or stylistic issue (e.g., 'Passive voice usage', 'Incorrect tense')."),
  problematicText: z.string().describe("The specific segment of text where the issue was found."),
  suggestion: z.string().describe("The suggested correction or improvement to address the issue."),
  explanation: z.string().optional().describe("A brief explanation for why the suggestion is made or the rule it pertains to, if helpful."),
});

const GrammarCheckOutputSchema = z.object({
  suggestions: z.array(GrammarSuggestionSchema).describe("A list of grammar and style suggestions. If no issues are found, this array may be empty."),
});
export type GrammarCheckOutput = z.infer<typeof GrammarCheckOutputSchema>;

export async function grammarCheck(input: GrammarCheckInput): Promise<GrammarCheckOutput> {
  return grammarCheckFlow(input);
}

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: {schema: GrammarCheckInputSchema},
  output: {schema: GrammarCheckOutputSchema},
  prompt: `You are an expert proofreader and editor. Your task is to meticulously review the following text for grammatical errors, spelling mistakes, punctuation errors, awkward phrasing, issues with clarity, and problems with style or tone.

For each issue you identify, please provide:
1.  'issue': A concise description of the type of error (e.g., "Subject-verb agreement", "Misplaced modifier", "Wordiness", "Passive voice", "Incorrect punctuation").
2.  'problematicText': The exact segment of text where the issue occurs.
3.  'suggestion': A corrected version of the problematic text or a clear instruction on how to improve it.
4.  'explanation': (Optional but recommended) A brief explanation of the grammar rule or reasoning behind your suggestion.

Analyze the text thoroughly. If there are no issues, return an empty array for suggestions.

Text to check:
--- TEXT START ---
{{{textToCheck}}}
--- TEXT END ---

Return your findings in the specified structured JSON format.
`,
});

const grammarCheckFlow = ai.defineFlow(
  {
    name: 'grammarCheckFlow',
    inputSchema: GrammarCheckInputSchema,
    outputSchema: GrammarCheckOutputSchema,
  },
  async (input: GrammarCheckInput) => {
    // Configure safety settings to be less restrictive for text analysis tasks.
    const {output} = await grammarCheckPrompt(input, {
        config: {
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
        }
    });
    return {
      suggestions: output?.suggestions ?? [],
    };
  }
);
    