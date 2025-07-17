
"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileText, RefreshCw, Image as ImageIcon, CheckSquare, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

import type { GatherRelevantContentOutput } from '@/ai/flows/gather-relevant-content';
import type { ContinueContentInput } from '@/ai/flows/continue-content-flow';
import type { GenerateImageInput } from '@/ai/flows/generate-image-flow';
import type { GrammarCheckOutput, GrammarCheckInput } from '@/ai/flows/grammar-check-flow';
import { handleGatherContent, handleContinueContent, handleGenerateImage, handleGrammarCheck } from './actions';
import MarkdownDisplay from '@/components/markdown-display';
import PdfDownloadButton from '@/components/pdf-download-button';
import JsonDownloadButton from '@/components/json-download-button';
import MarkdownDownloadButton from '@/components/markdown-download-button';
import ImageDownloadButton from '@/components/image-download-button';
import DocxDownloadButton from '@/components/docx-download-button';
import SourceList from '@/components/source-list';
import Image from 'next/image';

const formSchema = z.object({
  prompt: z.string().min(5, { message: "Prompt must be at least 5 characters." }).max(200, {message: "Prompt must be at most 200 characters."}),
  audienceLevel: z.string().min(1, { message: "Please select an audience level." }),
});

type FormValues = z.infer<typeof formSchema>;

const audienceLevels = [
  { value: "Elementary School", label: "Elementary School Student" },
  { value: "Middle School", label: "Middle School Student" }, 
  { value: "Junior High School", label: "Junior High School Student" },
  { value: "High School", label: "High School Student" },
  { value: "Undergraduate", label: "Undergraduate Student" },
  { value: "Postgraduate", label: "Postgraduate Student" },
  { value: "Professional", label: "Professional in the Field" },
  { value: "General Public", label: "General Public / Curious Learner" },
  { value: "Expert", label: "Expert (Academic Research)" },
];

const generateAiHintFromPrompt = (prompt: string): string => {
  if (!prompt) return "image";
  return prompt.toLowerCase().split(/\s+/).slice(0, 2).join(' ').replace(/[^\w\s]/gi, '');
};

export default function ContentAggregatorClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [output, setOutput] = useState<GatherRelevantContentOutput | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarCheckOutput['suggestions'] | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [currentAudienceLevel, setCurrentAudienceLevel] = useState<string>("");
  

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      audienceLevel: "Undergraduate",
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'prompt' || name === 'audienceLevel') {
        if (output) setOutput(null); 
        if (generatedImageUrl) setGeneratedImageUrl(null);
        if (grammarSuggestions) setGrammarSuggestions(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, output, generatedImageUrl, grammarSuggestions]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setOutput(null);
    setGeneratedImageUrl(null);
    setGrammarSuggestions(null);
    setCurrentPrompt(values.prompt);
    setCurrentAudienceLevel(values.audienceLevel);

    const input = { 
      prompt: values.prompt,
      audienceLevel: values.audienceLevel,
    };
    const result = await handleGatherContent(input);

    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Error Gathering Content",
        description: result.error, 
      });
    } else {
      setOutput(result);
      if (result.content && !result.content.startsWith("After reviewing potential sources")) {
        toast({
          title: "Success",
          description: "Content gathered successfully!",
        });
      } else {
         toast({
          variant: "default",
          title: "No Content Found",
          description: result.content, 
        });
      }
    }
  }

  async function onContinueGeneration() {
    if (!output || !output.content || !currentPrompt || !currentAudienceLevel) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot continue generation without initial content, prompt, and audience level.",
      });
      return;
    }

    setIsContinuing(true);
    setGrammarSuggestions(null); // Clear old grammar suggestions

    const input: ContinueContentInput = {
      originalPrompt: currentPrompt,
      audienceLevel: currentAudienceLevel,
      existingContent: output.content,
      sources: output.sources, 
    };

    const result = await handleContinueContent(input);
    setIsContinuing(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Error Continuing Generation",
        description: result.error,
      });
    } else {
      setOutput(prevOutput => ({
        ...prevOutput!,
        content: (prevOutput!.content || "") + "\n\n" + result.continuedContent,
        sources: prevOutput!.sources 
      }));
      toast({
        title: "Content Extended",
        description: "More content has been generated and appended.",
      });
    }
  }

  async function onGenerateImage() {
    if (!currentPrompt) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot generate image without an initial prompt for context.",
      });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null); 

    const input: GenerateImageInput = { prompt: currentPrompt };
    const result = await handleGenerateImage(input);
    setIsGeneratingImage(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Error Generating Image",
        description: result.error,
      });
    } else {
      setGeneratedImageUrl(result.imageDataUri);
      toast({
        title: "Image Generated",
        description: "An image has been generated for your content.",
      });
    }
  }

  async function onGrammarCheck() {
    if (!output || !output.content) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No content available to check grammar.",
      });
      return;
    }
    setIsCheckingGrammar(true);
    setGrammarSuggestions(null);

    const input: GrammarCheckInput = { textToCheck: output.content };
    const result = await handleGrammarCheck(input);
    setIsCheckingGrammar(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Error Checking Grammar",
        description: result.error,
      });
    } else {
      setGrammarSuggestions(result.suggestions);
      if (result.suggestions.length > 0) {
        toast({
          title: "Grammar Check Complete",
          description: `Found ${result.suggestions.length} potential issue(s).`,
        });
      } else {
        toast({
          title: "Grammar Check Complete",
          description: "No grammatical issues found!",
        });
      }
    }
  }

  function handleApplySuggestion(problematicText: string, suggestion: string) {
    if (!output || !output.content) {
      toast({
        variant: "destructive",
        title: "Error Applying Change",
        description: "No content available to modify.",
      });
      return;
    }

    const newContent = output.content.replace(problematicText, suggestion);

    if (newContent === output.content) {
      toast({
        variant: "default",
        title: "Could Not Apply Change",
        description: "The original text to be replaced was not found. It might have been changed by a previous correction.",
      });
    } else {
      toast({
        title: "Change Applied",
        description: "The suggestion has been applied to the main content.",
      });
    }

    setOutput(prevOutput => ({
      ...prevOutput!,
      content: newContent,
    }));

    // Remove the applied suggestion from the list to prevent re-applying.
    // This is safer than filtering by index, especially if the list re-orders.
    setGrammarSuggestions(prevSuggestions =>
      prevSuggestions!.filter(s => s.problematicText !== problematicText || s.suggestion !== suggestion)
    );
  }

  const anyOperationInProgress = isLoading || isContinuing || isGeneratingImage || isCheckingGrammar;

  return (
    <>
    <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
          <Image src={"/CDN-logo-stroked-transparent.png"} alt="CDN Icon" width={48} height={48}/>
          </div>
          <div>
            <CardTitle className="text-3xl font-headline text-primary">CDN Content Finder</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Enter a topic and select the target audience, and let AI gather relevant information for you.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="prompt-input" className="text-lg font-semibold">Your Topic/Prompt</FormLabel>
                  <FormControl>
                    <Input 
                      id="prompt-input"
                      placeholder="e.g., 'The future of renewable energy'" 
                      {...field} 
                      className="text-base py-3 h-12 rounded-lg focus:ring-primary focus:border-primary"
                      aria-describedby="prompt-help prompt-error"
                      aria-invalid={!!form.formState.errors.prompt}
                    />
                  </FormControl>
                  <p id="prompt-help" className="text-sm text-muted-foreground">
                    Be specific for better results. (Min 5, Max 200 characters)
                  </p>
                  <FormMessage id="prompt-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="audience-level-select" className="text-lg font-semibold">Target Audience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        id="audience-level-select" 
                        className="text-base py-3 h-12 rounded-lg focus:ring-primary focus:border-primary"
                        aria-describedby="audience-level-help audience-level-error"
                        aria-invalid={!!form.formState.errors.audienceLevel}
                      >
                        <SelectValue placeholder="Select an audience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {audienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value} className="text-base">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                   <p id="audience-level-help" className="text-sm text-muted-foreground">
                    The AI will tailor the content complexity to this level.
                  </p>
                  <FormMessage id="audience-level-error" />
                  </Select>
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={anyOperationInProgress} className="w-full sm:w-auto text-base py-3 px-6 rounded-lg h-12 text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/50">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gathering Content...
                </>
              ) : (
                "Start Gathering"
              )}
            </Button>
          </form>
        </Form>

        {(isLoading || isContinuing || isGeneratingImage || isCheckingGrammar) && (
          <div className="mt-8 flex flex-col items-center justify-center text-center p-6 bg-secondary/30 rounded-lg shadow-inner animate-pulse">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-foreground">
              {isLoading && "Processing your initial request..."}
              {isContinuing && "Generating more content..."}
              {isGeneratingImage && "Generating your image..."}
              {isCheckingGrammar && "Checking grammar and style..."}
            </p>
            <p className="text-muted-foreground">This might take a few moments. Please wait.</p>
          </div>
        )}

        {output && !isLoading && output.content && (
          <div className="mt-8 space-y-6">
            <Separator />
            <div>
              <h2 className="text-2xl font-headline font-semibold mb-4 text-primary">Aggregated Content (for {currentAudienceLevel || form.getValues("audienceLevel")})</h2>
              <div className="p-4 sm:p-6 border border-border rounded-lg bg-background shadow-sm">
                <MarkdownDisplay content={output.content} />
              </div>
            </div>

            {/* Action Buttons Area */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
                {output.content && !isContinuing && (
                    <Button 
                        onClick={onContinueGeneration} 
                        disabled={anyOperationInProgress} 
                        variant="outline"
                        className="text-base py-3 px-6 rounded-lg h-12 border-accent text-accent hover:bg-accent/10 hover:text-accent transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-accent/30"
                    >
                        {isContinuing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Continuing...
                        </>
                        ) : (
                        <>
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Continue Generation
                        </>
                        )}
                    </Button>
                )}
                {output.content && (
                    <Button 
                        onClick={onGenerateImage} 
                        disabled={anyOperationInProgress}
                        variant="outline"
                        className="text-base py-3 px-6 rounded-lg h-12 border-accent text-accent hover:bg-accent/10 hover:text-accent transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-accent/30"
                    >
                        {isGeneratingImage ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (generatedImageUrl ? <RefreshCw className="mr-2 h-5 w-5" /> : <ImageIcon className="mr-2 h-5 w-5" />)}
                        {generatedImageUrl ? "Regenerate Image" : "Generate Image"}
                    </Button>
                )}
                 {output.content && (
                    <Button 
                        onClick={onGrammarCheck} 
                        disabled={anyOperationInProgress}
                        variant="outline"
                        className="text-base py-3 px-6 rounded-lg h-12 border-accent text-accent hover:bg-accent/10 hover:text-accent transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-accent/30"
                    >
                        {isCheckingGrammar ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckSquare className="mr-2 h-5 w-5" />}
                        Check Grammar
                    </Button>
                )}
            </div>
            
            {/* Image Display Area */}
            {generatedImageUrl && !isGeneratingImage && (
              <div className="mt-6 p-4 border border-border rounded-lg bg-background shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-headline font-semibold mb-3 text-primary/80">Generated Image</h3>
                <div className="relative group">
                  <img 
                    src={generatedImageUrl} 
                    alt={`AI generated image for: ${currentPrompt}`} 
                    className="max-w-full h-auto rounded-md shadow-md"
                    style={{maxHeight: '400px'}}
                    data-ai-hint={generateAiHintFromPrompt(currentPrompt)}
                  />
                  <ImageDownloadButton 
                    imageDataUri={generatedImageUrl}
                    fileName={`ai-image-${(currentPrompt || 'prompt').replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}.png`}
                  />
                </div>
              </div>
            )}
            {!generatedImageUrl && isGeneratingImage && (
               <div className="mt-6 p-4 border border-border rounded-lg bg-background shadow-sm flex flex-col items-center">
                  <h3 className="text-xl font-headline font-semibold mb-3 text-primary/80">Generating Image...</h3>
                  <img 
                      src={`https://placehold.co/1280x1080.png`} 
                      alt="Placeholder for AI generated image" 
                      className="max-w-full h-auto rounded-md shadow-md opacity-50"
                      style={{maxHeight: '400px'}}
                      data-ai-hint={generateAiHintFromPrompt(currentPrompt)}
                  />
               </div>
             )}

            {/* Grammar Suggestions Area */}
            {grammarSuggestions && !isCheckingGrammar && (
              <div className="mt-8 space-y-4">
                <Separator />
                <h2 className="text-2xl font-headline font-semibold text-primary">Grammar & Style Suggestions</h2>
                {grammarSuggestions.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {grammarSuggestions.map((item, index) => (
                      <AccordionItem value={`item-${index}`} key={`${index}-${item.problematicText}`}>
                        <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex flex-col">
                                <span className="font-semibold text-primary/90">{item.issue}</span>
                                <span className="text-sm text-muted-foreground italic">Original: "{item.problematicText}"</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p><strong className="text-foreground">Suggestion:</strong> {item.suggestion}</p>
                            {item.explanation && <p className="text-sm text-muted-foreground"><strong className="text-foreground/80">Explanation:</strong> {item.explanation}</p>}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplySuggestion(item.problematicText, item.suggestion)}
                              className="mt-2 border-primary text-primary hover:bg-primary/10"
                            >
                              Apply Change
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground">No specific grammar or style issues found by the AI.</p>
                )}
              </div>
            )}
            
            {/* Sources Display Area */}
            {output.sources && output.sources.length > 0 && (
              <div className="mt-8 space-y-4">
                <Separator />
                <h2 className="text-2xl font-headline font-semibold text-primary flex items-center">
                  <BookOpen className="mr-3 h-6 w-6" />
                  Sources Used
                </h2>
                <div className="p-4 border border-border rounded-lg bg-background shadow-sm">
                  <SourceList sources={output.sources} />
                </div>
              </div>
            )}

          </div>
        )}
      </CardContent>
      {output && !isLoading && output.content && (
        <CardFooter className="flex flex-wrap justify-end gap-2 pt-6 mt-4 border-t border-border">
           <PdfDownloadButton 
            content={output.content || ""} 
            prompt={`${currentPrompt || form.getValues("prompt")}`}
            fileName={`cdn-content-${(currentPrompt || form.getValues("prompt")).replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${(currentAudienceLevel || form.getValues("audienceLevel")).replace(/\s+/g, '-').toLowerCase()}.pdf`}
          />
           <DocxDownloadButton
            content={output.content || ""}
            prompt={`${currentPrompt || form.getValues("prompt")}`}
            fileName={`cdn-content-${(currentPrompt || form.getValues("prompt")).replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${(currentAudienceLevel || form.getValues("audienceLevel")).replace(/\s+/g, '-').toLowerCase()}.docx`}
          />
           <JsonDownloadButton
            content={output.content || ""}
            prompt={`${currentPrompt || form.getValues("prompt")}`}
            audience={`${currentAudienceLevel || form.getValues("audienceLevel")}`}
            fileName={`cdn-content-${(currentPrompt || form.getValues("prompt")).replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${(currentAudienceLevel || form.getValues("audienceLevel")).replace(/\s+/g, '-').toLowerCase()}.json`}
           />
           <MarkdownDownloadButton
            content={output.content || ""}
            prompt={`${currentPrompt || form.getValues("prompt")}`}
            audience={`${currentAudienceLevel || form.getValues("audienceLevel")}`}
            fileName={`cdn-content-${(currentPrompt || form.getValues("prompt")).replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${(currentAudienceLevel || form.getValues("audienceLevel")).replace(/\s+/g, '-').toLowerCase()}.md`}
           />
        </CardFooter>
      )}
    </Card>
    </>
  );
}
