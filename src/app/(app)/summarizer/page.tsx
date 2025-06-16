
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText as FileTextIcon, AlertTriangle, Wand2, Type, Mic2, Presentation, Video as VideoIconLucide, FileUp, UploadCloud, Youtube, Key, Brain, Info, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput, SummarizeTextOutput } from "@/ai/flows/summarize-text-flow";
import { cn } from "@/lib/utils";
import React from "react";

type InputType = "text" | "recording" | "pdf" | "powerpoint" | "video";

interface InputTypeOption {
  value: InputType;
  label: string;
  icon: React.ElementType;
  description: string;
  placeholder: string;
  title: string;
}

const inputTypeOptions: InputTypeOption[] = [
  { value: "text", label: "Text", icon: Type, title:"AI Text Summarizer & Note Taker", description: "Paste any text — articles, essays, or research papers — and get concise summaries, key takeaways, and organized notes instantly.", placeholder: "Paste your article, essay, research paper, or any text here..." },
  { value: "recording", label: "Audio", icon: Mic2, title:"AI Audio Note Taker", description: "Unpack lectures and meetings. Upload audio or record live, and Sai transcribes and summarizes, pinpointing key discussions and insights.", placeholder: "Audio summarization coming soon!" },
  { value: "pdf", label: "PDF", icon: FileTextIcon, title:"AI PDF Summarizer", description: "Master documents faster. Upload any PDF and Sai extracts core arguments, methodology, findings, and conclusions into comprehensive notes.", placeholder: "PDF summarization coming soon!" },
  { value: "powerpoint", label: "Slides", icon: Presentation, title:"AI Slide Summarizer", description: "Ace presentations. Sai converts PPT or PDF slides into actionable study notes, detailing core messages, narrative flow, and key takeaways.", placeholder: "Slide summarization coming soon!" },
  { value: "video", label: "Video", icon: VideoIconLucide, title:"AI Video Summarizer", description: "Learn faster from videos. Paste any YouTube link, and Sai extracts crucial topics, arguments, and examples into concise study notes.", placeholder: "https://www.youtube.com/watch?v=..." },
];

const MAX_CHARACTERS = 10000;

export default function SummarizerPage() {
  const [inputText, setInputText] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [generatedNoteOutput, setGeneratedNoteOutput] = useState<SummarizeTextOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeInputType, setActiveInputType] = useState<InputType>("text");
  const [characterCount, setCharacterCount] = useState<number>(0);

  const currentInputTypeConfig = inputTypeOptions.find(opt => opt.value === activeInputType) || inputTypeOptions[0];

  useEffect(() => {
    if (activeInputType === "text") {
      setCharacterCount(inputText.length);
    } else {
      setCharacterCount(0); 
    }
  }, [inputText, activeInputType]);

  const handleSummarizeText = async () => {
    if (inputText.trim().length < 10) {
      toast({ title: "Input too short", description: "Please enter at least 10 characters.", variant: "destructive" });
      return;
    }
    if (inputText.length > MAX_CHARACTERS) {
      toast({ title: "Input too long", description: `Max ${MAX_CHARACTERS} characters. Current: ${inputText.length}.`, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedNoteOutput(null);

    try {
      const input: SummarizeTextInput = { textToSummarize: inputText };
      const result = await summarizeText(input);
      setGeneratedNoteOutput(result);
      toast({ title: "Note Generated", description: "Your content has been successfully processed." });
    } catch (e) {
      console.error("Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureUnderDevelopment = (inputTypeLabel: string) => {
    toast({
        title: `${inputTypeLabel} Summarization - Coming Soon!`,
        description: `Generating notes from ${inputTypeLabel} is a feature we're actively developing. Please use Text input for now.`,
        variant: "default",
      });
  };

  const handleMainGenerateClick = () => {
    if (activeInputType === "text") {
      handleSummarizeText();
    } else {
      handleFeatureUnderDevelopment(currentInputTypeConfig.label);
    }
  };

  const renderInputArea = () => {
    switch(activeInputType) {
      case "text":
        return (
          <div className="p-3 sm:p-4 border-2 border-dashed border-primary/30 rounded-xl bg-card shadow-sm">
            <Textarea
              placeholder={currentInputTypeConfig.placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              className="resize-none w-full !border-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 p-2 bg-transparent placeholder:text-muted-foreground/70 text-sm"
              disabled={isLoading}
              maxLength={MAX_CHARACTERS}
              aria-label="Text to summarize"
            />
            <div className="mt-2 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleFeatureUnderDevelopment("File Upload")} className="text-xs">
                  <FileUp className="mr-1.5 h-3.5 w-3.5" /> Upload .txt / .docx
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {characterCount}/{MAX_CHARACTERS} characters
              </p>
            </div>
          </div>
        );
      case "video":
        return (
            <div className="p-4 sm:p-6 border-2 border-dashed border-primary/30 rounded-xl bg-card shadow-sm text-center">
                <VideoIconLucide className="h-12 w-12 text-primary mx-auto mb-4 opacity-80" />
                <div className="relative mb-2">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="url"
                        placeholder={currentInputTypeConfig.placeholder}
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="pl-10 text-sm h-11"
                        disabled={isLoading} 
                        aria-label="YouTube video URL"
                    />
                </div>
                 <p className="text-xs text-muted-foreground mt-1">Currently supports YouTube video links.</p>
            </div>
        );
      case "pdf":
      case "powerpoint":
      case "recording":
         return (
            <div
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-xl min-h-[200px] bg-card shadow-sm cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                onClick={() => handleFeatureUnderDevelopment(currentInputTypeConfig.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleFeatureUnderDevelopment(currentInputTypeConfig.label)}
            >
                <currentInputTypeConfig.icon className="h-12 w-12 text-primary mx-auto mb-4 opacity-80"/>
                <p className="text-base font-semibold text-foreground mb-1">Click or drag file to upload</p>
                <p className="text-xs text-muted-foreground mb-4">
                    {currentInputTypeConfig.label} summarization is coming soon!
                </p>
                <Button variant="outline" size="sm" className="pointer-events-none">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                </Button>
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="pb-8 pt-0">
      <div className="text-center mb-6 mt-0">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary">
           {currentInputTypeConfig.title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto text-sm sm:text-base">
          {currentInputTypeConfig.description}
        </p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex flex-wrap justify-center gap-1">
          {inputTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeInputType === option.value ? "secondary" : "ghost"}
              onClick={() => {
                setActiveInputType(option.value);
                setGeneratedNoteOutput(null); setError(null); setInputText(""); setVideoUrl("");
              }}
              className={cn(
                "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1.5 sm:gap-2",
                activeInputType === option.value && "shadow-md bg-background text-primary font-semibold"
              )}
              aria-pressed={activeInputType === option.value}
            >
              <option.icon className={cn("h-4 w-4", activeInputType === option.value ? "text-primary" : "text-muted-foreground")} />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {renderInputArea()}
        <div className="mt-6 text-center">
            <Button
            onClick={handleMainGenerateClick}
            disabled={isLoading ||
              (activeInputType === "text" && (!inputText.trim() || characterCount < 10 || characterCount > MAX_CHARACTERS)) ||
              (activeInputType === "video" && !videoUrl.trim()) ||
              activeInputType === "pdf" ||
              activeInputType === "recording" ||
              activeInputType === "powerpoint"
            }
            size="lg"
            className="px-8 py-3 text-base"
            >
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-5 w-5" />
            )}
            Generate Notes
            </Button>
        </div>
      </div>


      {error && (
        <Alert variant="destructive" className="mt-6 max-w-3xl mx-auto shadow-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Generating Notes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedNoteOutput && !isLoading && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Brain className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>AI-Generated Notes</CardTitle>
            <CardDescription>Comprehensive insights from your provided content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-primary mb-1.5">Summary:</h3>
              <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                {generatedNoteOutput.summary}
              </div>
            </div>

            {generatedNoteOutput.keyEntities && generatedNoteOutput.keyEntities.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">Key Entities:</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedNoteOutput.keyEntities.map((entity, index) => (
                    <span key={index} className="text-xs bg-accent/20 text-accent-foreground py-1 px-2.5 rounded-full shadow-sm">{entity}</span>
                  ))}
                </div>
              </div>
            )}

            {generatedNoteOutput.sentiment && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">Sentiment:</h3>
                <p className="text-sm p-3 bg-muted/20 rounded-md shadow-inner">{generatedNoteOutput.sentiment}</p>
              </div>
            )}
            
            {generatedNoteOutput.keywords && generatedNoteOutput.keywords.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center"><Key className="mr-2 h-4 w-4"/>Keywords:</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedNoteOutput.keywords.map((keyword, index) => (
                    <span key={index} className="text-xs bg-secondary text-secondary-foreground py-1 px-2.5 rounded-md shadow-sm">{keyword}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>
                These notes are AI-generated and intended for study assistance. Always cross-reference critical information with reliable sources.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
