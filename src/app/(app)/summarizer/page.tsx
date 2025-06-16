
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText as FileTextIcon, AlertTriangle, Wand2, Type, Mic2, Presentation, Video as VideoIconLucide, FileUp, UploadCloud, Youtube, Key, Brain, Info, Sparkles, SendHorizonal, MessageSquare, ChevronRightSquare, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput, SummarizeTextOutput } from "@/ai/flows/summarize-text-flow";
import { aiGuidedStudySession, AIGuidedStudySessionInput, AIGuidedStudySessionOutput } from "@/ai/flows/ai-guided-study-session";
import { useUserProfile } from "@/contexts/user-profile-context";
import { cn } from "@/lib/utils";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";


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
  { value: "pdf", label: "PDF", icon: FileTextIcon, title:"AI PDF Summarizer & Q&A", description: "Upload your PDF to get a summary, and then ask specific questions about its content. *Please note: PDF content is not actually read; AI responds based on filename and your questions.*", placeholder: "Upload your PDF document." },
  { value: "recording", label: "Audio", icon: Mic2, title:"AI Audio Note Taker", description: "Unpack lectures and meetings. Upload audio or record live, and Sai transcribes and summarizes, pinpointing key discussions and insights.", placeholder: "Audio summarization coming soon!" },
  { value: "powerpoint", label: "Slides", icon: Presentation, title:"AI Slide Summarizer", description: "Ace presentations. Sai converts PPT or PDF slides into actionable study notes, detailing core messages, narrative flow, and key takeaways.", placeholder: "Slide summarization coming soon!" },
  { value: "video", label: "Video", icon: VideoIconLucide, title:"AI Video Summarizer", description: "Learn faster from videos. Paste any YouTube link, and Sai extracts crucial topics, arguments, and examples into concise study notes.", placeholder: "https://www.youtube.com/watch?v=..." },
];

const MAX_CHARACTERS = 10000;

export default function SummarizerPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [inputText, setInputText] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [generatedNoteOutput, setGeneratedNoteOutput] = useState<SummarizeTextOutput | null>(null); // For text mode
  
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfProcessingOutput, setPdfProcessingOutput] = useState<AIGuidedStudySessionOutput | null>(null); // For PDF summary/Q&A
  const [pdfQuestionHistory, setPdfQuestionHistory] = useState<Array<{ question: string; answer: string; id: string }>>([]);
  const [currentPdfQuestion, setCurrentPdfQuestion] = useState<string>("");
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading for text, video etc.
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
  
  useEffect(() => {
    // Clear PDF specific states when switching away from PDF mode or when a new PDF is uploaded
    if (activeInputType !== 'pdf') {
      setUploadedPdfFile(null);
      setPdfProcessingOutput(null);
      setPdfQuestionHistory([]);
      setCurrentPdfQuestion("");
    }
  }, [activeInputType]);


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

  const handlePdfFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Invalid File Type", description: "Please upload a PDF file.", variant: "destructive" });
        setUploadedPdfFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDF (conceptual)
        toast({ title: "File too large", description: "Please upload a PDF smaller than 10MB.", variant: "destructive" });
        setUploadedPdfFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setUploadedPdfFile(file);
      setPdfProcessingOutput(null); // Clear previous summary/Q&A if a new file is chosen
      setPdfQuestionHistory([]);
      setCurrentPdfQuestion("");
      setError(null);
      toast({ title: "PDF Selected", description: `Ready to process "${file.name}".`});
    }
  };

  const handleSummarizePdf = async () => {
    if (!uploadedPdfFile || !profile) {
      toast({ title: "Missing Input", description: "Please upload a PDF file and ensure you are logged in.", variant: "destructive" });
      return;
    }
    setIsProcessingPdf(true);
    setError(null);
    setPdfProcessingOutput(null);
    setPdfQuestionHistory([]);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "PDF Content Summarization & Q&A",
        question: `Summarize the PDF: ${uploadedPdfFile.name}`,
        originalFileName: uploadedPdfFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setPdfProcessingOutput(result);
      toast({ title: "PDF Summary Generated", description: `Summary for "${uploadedPdfFile.name}" is ready.` });
    } catch (e) {
      console.error("PDF Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during PDF summarization.";
      setError(errorMessage);
      toast({ title: "PDF Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleAskPdfQuestion = async () => {
    if (!currentPdfQuestion.trim() || !uploadedPdfFile || !profile) {
      toast({ title: "Missing Input", description: "Please type a question and ensure a PDF is loaded.", variant: "destructive" });
      return;
    }
    setIsProcessingPdf(true); // Reuse loading state
    setError(null);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "PDF Content Summarization & Q&A",
        question: currentPdfQuestion,
        originalFileName: uploadedPdfFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setPdfProcessingOutput(result); // Store latest AI response (answer & new suggestions)
      setPdfQuestionHistory(prev => [...prev, { question: currentPdfQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentPdfQuestion(""); // Clear input after asking
      toast({ title: "Answer Received", description: "AI has responded to your question." });
    } catch (e) {
      console.error("PDF Q&A error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during PDF Q&A.";
      setError(errorMessage); // Show error related to Q&A
      toast({ title: "PDF Q&A Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingPdf(false);
    }
  };


  const handleFeatureUnderDevelopment = (inputTypeLabel: string) => {
    toast({
        title: `${inputTypeLabel} Summarization - Coming Soon!`,
        description: `Generating notes from ${inputTypeLabel} is a feature we're actively developing. Please use Text or PDF input for now.`,
        variant: "default",
      });
  };

  const handleMainGenerateClick = () => {
    if (activeInputType === "text") {
      handleSummarizeText();
    } else if (activeInputType === "pdf") {
      handleSummarizePdf();
    }
     else {
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
      case "pdf":
        return (
            <div
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-xl min-h-[200px] bg-card shadow-sm"
            >
                <input type="file" ref={fileInputRef} onChange={handlePdfFileChange} accept=".pdf" className="hidden" id="pdf-upload-input" />
                <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()} className="mb-3">
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload PDF
                </Button>
                {uploadedPdfFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedPdfFile.name}</span></p>
                )}
                {!uploadedPdfFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB. AI will summarize based on filename and your questions.</p>
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
      case "recording":
      case "powerpoint":
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
                setUploadedPdfFile(null); setPdfProcessingOutput(null); setPdfQuestionHistory([]); setCurrentPdfQuestion("");
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
            disabled={isLoading || isProcessingPdf ||
              (activeInputType === "text" && (!inputText.trim() || characterCount < 10 || characterCount > MAX_CHARACTERS)) ||
              (activeInputType === "pdf" && !uploadedPdfFile) ||
              (activeInputType === "video" && !videoUrl.trim()) ||
              activeInputType === "recording" ||
              activeInputType === "powerpoint"
            }
            size="lg"
            className="px-8 py-3 text-base"
            >
            {(isLoading || isProcessingPdf) ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-5 w-5" />
            )}
            {activeInputType === 'pdf' ? "Summarize PDF & Start Q&A" : "Generate Notes"}
            </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6 max-w-3xl mx-auto shadow-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Processing</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display for Text Summarization Output */}
      {activeInputType === 'text' && generatedNoteOutput && !isLoading && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Brain className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>AI-Generated Notes from Text</CardTitle>
            <CardDescription>Comprehensive insights from your provided text.</CardDescription>
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

      {/* Display for PDF Summarization & Q&A Output */}
      {activeInputType === 'pdf' && uploadedPdfFile && !isProcessingPdf && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <FileTextIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
              PDF Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={uploadedPdfFile.name}>{uploadedPdfFile.name}</span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your PDF document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pdfProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">
                  {pdfQuestionHistory.length === 0 ? "Summary:" : "Latest Answer:"}
                </h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                  {pdfProcessingOutput.response}
                </div>
              </div>
            )}

            {pdfProcessingOutput?.suggestions && pdfProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:
                </h3>
                <ul className="space-y-1.5">
                    {pdfProcessingOutput.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs">
                        <Button
                            variant="link"
                            className="p-0 h-auto text-accent hover:text-accent/80 text-left"
                            onClick={() => {
                                setCurrentPdfQuestion(suggestion);
                                // Optionally, auto-focus the input field here
                            }}
                        >
                            <ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}
                        </Button>
                        </li>
                    ))}
                </ul>
              </div>
            )}
            
            {pdfQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2">
                <div className="space-y-4">
                  {pdfQuestionHistory.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p>
                      <p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </div>
            )}

            {pdfProcessingOutput && ( // Show Q&A input only after initial summary
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedPdfFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentPdfQuestion}
                    onChange={(e) => setCurrentPdfQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-grow"
                    disabled={isProcessingPdf}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentPdfQuestion.trim()) { e.preventDefault(); handleAskPdfQuestion(); } }}
                  />
                  <Button onClick={handleAskPdfQuestion} disabled={isProcessingPdf || !currentPdfQuestion.trim()}>
                    {isProcessingPdf && currentPdfQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>}
                    Ask
                  </Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>
                AI responses for PDFs are based on filename and your questions, not actual PDF content processing.
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

