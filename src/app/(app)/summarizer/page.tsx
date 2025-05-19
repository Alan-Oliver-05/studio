
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, AlertTriangle, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput } from "@/ai/flows/summarize-text-flow";

export default function SummarizerPage() {
  const [textToSummarize, setTextToSummarize] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (textToSummarize.trim().length < 10) {
      toast({
        title: "Input too short",
        description: "Please enter at least 10 characters to summarize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary("");

    try {
      const input: SummarizeTextInput = { textToSummarize };
      const result = await summarizeText(input);
      setSummary(result.summary);
      toast({
        title: "Summary Generated",
        description: "Your text has been successfully summarized.",
      });
    } catch (e) {
      console.error("Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during summarization.";
      setError(errorMessage);
      toast({
        title: "Summarization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }; // Ensure this closing brace is present and correct

  return (
    <div className="pb-8 pt-0">
      <div className="mb-6 pt-0 mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
          <FileText className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Text Summarizer
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste your text below to get a concise AI-generated summary.
        </p>
      </div>

      <Card className="shadow-lg max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Enter the text you want to summarize.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your long text here..."
            value={textToSummarize}
            onChange={(e) => setTextToSummarize(e.target.value)}
            rows={10}
            className="resize-none"
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSummarize} disabled={isLoading || !textToSummarize.trim()}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Summarize Text
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6 max-w-3xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && !isLoading && (
        <Card className="mt-6 shadow-lg max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Generated Summary</CardTitle>
            <CardDescription>Here's the concise version of your text.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {summary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
