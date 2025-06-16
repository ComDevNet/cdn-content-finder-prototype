
"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileText, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import type { GatherRelevantContentInput, GatherRelevantContentOutput } from '@/ai/flows/gather-relevant-content';
import type { ContinueContentInput } from '@/ai/flows/continue-content-flow';
import { handleGatherContent, handleContinueContent } from './actions';
import MarkdownDisplay from '@/components/markdown-display';
import PdfDownloadButton from '@/components/pdf-download-button';
import JsonDownloadButton from '@/components/json-download-button';
import MarkdownDownloadButton from '@/components/markdown-download-button';
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

export default function ContentAggregatorClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [output, setOutput] = useState<GatherRelevantContentOutput | null>(null);
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
      if (output && (name === 'prompt' || name === 'audienceLevel')) {
        setOutput(null); 
      }
    });
    return () => subscription.unsubscribe();
  }, [form, output]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setOutput(null);
    setCurrentPrompt(values.prompt);
    setCurrentAudienceLevel(values.audienceLevel);

    const input: GatherRelevantContentInput = { 
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
      console.error("Full error from handleGatherContent:", result.error);
    } else {
      setOutput(result);
      if (result.content) {
        toast({
          title: "Success",
          description: "Content gathered successfully!",
        });
      } else {
         toast({
          variant: "default",
          title: "No Content Found",
          description: "Could not find relevant content for your prompt and audience. Try being more specific or changing the audience level.",
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
      console.error("Full error from handleContinueContent:", result.error);
    } else {
      setOutput(prevOutput => ({
        ...prevOutput!,
        content: (prevOutput!.content || "") + "\n\n" + result.continuedContent,
        // Preserve original sources, do not overwrite with empty if continuedContent doesn't return sources
        sources: prevOutput!.sources 
      }));
      toast({
        title: "Content Extended",
        description: "More content has been generated and appended.",
      });
    }
  }


  return (
    <>
    <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card rounded-xl mt-25">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
          <Image src={"/CDN-logo-stroked-transparent.png"} alt="CDN Icon" width={48} height={48} className="h-12 w-12" />
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
            
            <Button type="submit" disabled={isLoading || isContinuing} className="w-full sm:w-auto text-base py-3 px-6 rounded-lg h-12 text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-primary/50">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gathering Initial Content...
                </>
              ) : (
                "Start Gathering"
              )}
            </Button>
          </form>
        </Form>

        {(isLoading || isContinuing) && (
          <div className="mt-8 flex flex-col items-center justify-center text-center p-6 bg-secondary/30 rounded-lg shadow-inner animate-pulse">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-foreground">
              {isLoading ? "Processing your initial request..." : "Generating more content..."}
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
            
            {output.content && !isContinuing && (
                 <div className="flex justify-center pt-4">
                    <Button 
                        onClick={onContinueGeneration} 
                        disabled={isContinuing} 
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
                 </div>
            )}
          </div>
        )}
      </CardContent>
      {output && !isLoading && output.content && (
        <CardFooter className="flex flex-col sm:flex-row justify-end pt-6 mt-4 border-t border-border space-y-2 sm:space-y-0 sm:space-x-2">
           <PdfDownloadButton 
            content={output.content || ""} 
            prompt={`${currentPrompt || form.getValues("prompt")}`}
            fileName={`cdn-content-${(currentPrompt || form.getValues("prompt")).replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase().substring(0,30)}-${(currentAudienceLevel || form.getValues("audienceLevel")).replace(/\s+/g, '-').toLowerCase()}.pdf`}
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
