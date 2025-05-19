
"use client";

import { useState, useEffect, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText as FileTextIcon, AlertTriangle, Wand2, Type, Mic2, Presentation, Video as VideoIconLucide, FileUp, UploadCloud, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput } from "@/ai/flows/summarize-text-flow";
import { cn } from "@/lib/utils";
import React from "react"; 

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
  { value: "video", label: "Video", icon: VideoIconLucide },
];

const MAX_CHARACTERS = 10000;

export default function SummarizerPage() {
  const [inputText, setInputText] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [generatedNote, setGeneratedNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeInputType, setActiveInputType] = useState<InputType>("text");
  const [characterCount, setCharacterCount] = useState<number>(0);

  useEffect(() => {
    setCharacterCount(inputText.length);
  }, [inputText]);

  const handleGenerateNote = async () => {
    if (activeInputType !== "text") {
      toast({
        title: "Feature Not Available",
        description: `Generating notes from ${activeInputType} is not yet implemented. Please use the Text input for now.`,
        variant: "default",
      });
      return;
    }

    if (inputText.trim().length < 10) {
      toast({
        title: "Input too short",
        description: "Please enter at least 10 characters to generate a note.",
        variant: "destructive",
      });
      return;
    }
    if (inputText.length > MAX_CHARACTERS) {
      toast({
        title: "Input too long",
        description: `Please enter text less than ${MAX_CHARACTERS} characters.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedNote("");

    try {
      const input: SummarizeTextInput = { textToSummarize: inputText };
      const result = await summarizeText(input);
      setGeneratedNote(result.summary);
      toast({
        title: "Note Generated",
        description: "Your content has been successfully processed into a note.",
      });
    } catch (e) {
      console.error("Note generation error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during note generation.";
      setError(errorMessage);
      toast({
        title: "Note Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceholderButtonClick = (featureName: string) => {
    toast({
      title: "Coming Soon!",
      description: `${featureName} functionality is under development.`,
    });
  };
  
  const handleFeatureNotAvailable = () => {
    toast({
        title: "Feature Not Available",
        description: `Generating notes from ${activeInputType} content is not yet implemented. Please use the Text input for now.`,
        variant: "default",
      });
  }

  const showMainPageTitle = activeInputType !== "powerpoint" && activeInputType !== "video";

  return (
    <div className="pb-8 pt-0">
      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex space-x-1">
          {inputTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeInputType === option.value ? "secondary" : "ghost"}
              onClick={() => {
                setActiveInputType(option.value);
                setGeneratedNote(""); 
                setError(null);
                setInputText(""); // Clear text input when switching types
                setVideoUrl(""); // Clear video URL when switching types
              }}
              className={cn(
                "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1.5 sm:gap-2",
                activeInputType === option.value && "shadow-md bg-background"
              )}
            >
              <option.icon className={cn("h-4 w-4", activeInputType === option.value ? "text-primary" : "text-muted-foreground")} />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {showMainPageTitle && (
        <div className="text-center mb-8 mt-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
             AI Note Taker
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto text-sm sm:text-base">
            Give Sai any content — textbooks, videos, slides, or screenshots — and in &lt;30 seconds, it'll instantly read and turn it into clear, organized notes you can actually use.
          </p>
        </div>
      )}


      {activeInputType === "text" && (
        <div className="max-w-3xl mx-auto">
          <div className="p-4 sm:p-6 border-2 border-dashed border-primary/50 rounded-xl bg-card shadow-sm">
            <Textarea
              placeholder="Type or paste your Text here, or paste a YouTube link"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="resize-none w-full !border-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 p-2 bg-transparent placeholder:text-muted-foreground/70"
              disabled={isLoading}
              maxLength={MAX_CHARACTERS}
            />
            <div className="mt-3 flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePlaceholderButtonClick("Select file")} className="text-xs">
                  <FileUp className="mr-1.5 h-3.5 w-3.5" /> Select file
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePlaceholderButtonClick("Upload from drive")} className="text-xs">
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload from drive
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {characterCount}/{MAX_CHARACTERS} characters
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button 
              onClick={handleGenerateNote} 
              disabled={isLoading || !inputText.trim() || characterCount > MAX_CHARACTERS} 
              size="lg"
              className="px-8 py-3 text-base"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-5 w-5" />
              )}
              Generate note
            </Button>
          </div>
        </div>
      )}

      {activeInputType === "recording" && (
        <Card className="shadow-lg max-w-3xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-xl">Upload Your Audio Recording</CardTitle>
            <CardDescription>Get notes from your lectures or voice memos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[200px] bg-muted/30 cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                onClick={handleFeatureNotAvailable}
            >
              <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">Drag & Drop or Click to Upload</p>
              <p className="text-sm text-muted-foreground">
                Supported formats: MP3, WAV, M4A (Max 50MB)
              </p>
            </div>
          </CardContent>
           <CardFooter className="justify-center">
            <Button variant="outline" onClick={handleFeatureNotAvailable}>
              <Mic2 className="mr-2 h-4 w-4" /> Upload Recording
            </Button>
          </CardFooter>
        </Card>
      )}

      {activeInputType === "pdf" && (
        <Card className="shadow-lg max-w-3xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-xl">Upload PDF Document</CardTitle>
            <CardDescription>Extract key points from your PDF files.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[200px] bg-muted/30 cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                onClick={handleFeatureNotAvailable}
            >
              <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">Drag & Drop PDF or Click to Upload</p>
              <p className="text-sm text-muted-foreground">
                Supported format: .pdf (Max 20MB)
              </p>
            </div>
          </CardContent>
           <CardFooter className="justify-center">
            <Button variant="outline" onClick={handleFeatureNotAvailable}>
              <FileUp className="mr-2 h-4 w-4" /> Upload PDF
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {activeInputType === "powerpoint" && (
        <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
                Slide Summary
            </h1>
            <p className="text-muted-foreground mt-1 mb-8 max-w-xl mx-auto text-sm sm:text-base">
                Give Sai your slides and in under &lt;30 seconds, you'll get smart, clear notes that help you study stress-free.
            </p>
            <div 
                className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-xl min-h-[250px] bg-card shadow-sm cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                onClick={handleFeatureNotAvailable}
            >
                <UploadCloud className="h-16 w-16 text-muted-foreground/70 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">or drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mb-6">
                    Supported Formats: Images, PDF, Doc, Docs, PPT, PPTX; Max size: 20MB.
                </p>
                <Button variant="accent" size="lg" onClick={handleFeatureNotAvailable} className="px-8 mb-3">
                    <FileUp className="mr-2 h-5 w-5" /> Select file
                </Button>
                <button 
                    className="text-sm text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); handleFeatureNotAvailable();}}
                >
                    Or, upload from Google Drive
                </button>
            </div>
        </div>
      )}

      {activeInputType === "video" && (
         <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
                AI Video Summarizer
            </h1>
            <p className="text-muted-foreground mt-1 mb-8 max-w-xl mx-auto text-sm sm:text-base">
                Give Sai Youtube video and in &lt;30 seconds, you'll get clear, organized notes you can actually use to study better.
            </p>
            <Card className="shadow-lg bg-card/70 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex justify-center mb-6">
                        {/* Placeholder for the custom video icon. Using Lucide Video icon for now */}
                        <VideoIconLucide className="h-20 w-20 text-primary opacity-70" />
                    </div>
                    <div className="relative mb-6">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="pl-10 text-sm"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFeatureNotAvailable();
                                }
                            }}
                        />
                    </div>
                    <Button 
                        variant="accent" 
                        size="lg" 
                        onClick={handleFeatureNotAvailable} 
                        className="w-full text-base py-3"
                        disabled={isLoading}
                    >
                        Summarize
                    </Button>
                    <button 
                        className="mt-4 text-sm text-primary hover:underline"
                        onClick={(e) => { e.stopPropagation(); handleFeatureNotAvailable();}}
                    >
                        Or, upload from Google Drive
                    </button>
                </CardContent>
            </Card>
        </div>
      )}


      {error && activeInputType === "text" && (
        <Alert variant="destructive" className="mt-6 max-w-3xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedNote && activeInputType === "text" && !isLoading && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Generated Note</CardTitle>
            <CardDescription>Here's the AI-generated note from your text.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm leading-relaxed">
              {generatedNote}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
