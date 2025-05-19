
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText as FileTextIcon, AlertTriangle, Wand2, Type, Mic2, Presentation, Video as VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput } from "@/ai/flows/summarize-text-flow";
import { cn } from "@/lib/utils";

type InputType = "text" | "recording" | "pdf" | "powerpoint" | "video";

interface InputTypeOption {
  value: InputType;
  label: string;
  icon: React.ElementType;
}

const inputTypeOptions: InputTypeOption[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "recording", label: "Recording", icon: Mic2 },
  { value: "pdf", label: "PDF", icon: FileTextIcon },
  { value: "powerpoint", label: "PowerPoint", icon: Presentation },
  { value: "video", label: "Video", icon: VideoIcon },
];

export default function SummarizerPage() {
  const [textToSummarize, setTextToSummarize] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeInputType, setActiveInputType] = useState<InputType>("text");

  const handleSummarize = async () => {
    if (activeInputType !== "text") {
      toast({
        title: "Feature Not Available",
        description: `Summarizing ${activeInputType} is not yet implemented. Please use the Text input for now.`,
        variant: "destructive",
      });
      return;
    }

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
  };

  return (
    <div className="pb-8 pt-0">
      <div className="mb-6 pt-0 mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
          <FileTextIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Text Summarizer
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste your text or select a file type to get a concise AI-generated summary.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex space-x-1">
          {inputTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeInputType === option.value ? "secondary" : "ghost"}
              onClick={() => setActiveInputType(option.value)}
              className={cn(
                "px-4 py-2 h-auto text-sm sm:text-base rounded-md flex items-center gap-2",
                activeInputType === option.value && "shadow-md bg-background"
              )}
            >
              <option.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", activeInputType === option.value ? "text-primary" : "text-muted-foreground")} />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {activeInputType === "text" && (
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
      )}

      {activeInputType !== "text" && (
        <Card className="shadow-lg max-w-3xl mx-auto text-center">
          <CardHeader>
            <CardTitle>Summarize {inputTypeOptions.find(opt => opt.value === activeInputType)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[200px] bg-muted/30">
              {React.createElement(inputTypeOptions.find(opt => opt.value === activeInputType)?.icon || AlertTriangle, { className: "h-16 w-16 text-muted-foreground mb-4" })}
              <p className="text-lg text-muted-foreground">
                Summarizing {activeInputType} files is coming soon!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For now, please use the "Text" input option.
              </p>
            </div>
          </CardContent>
           <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => setActiveInputType("text")}>
              Switch to Text Input
            </Button>
          </CardFooter>
        </Card>
      )}

      {error && activeInputType === "text" && (
        <Alert variant="destructive" className="mt-6 max-w-3xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && activeInputType === "text" && !isLoading && (
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
