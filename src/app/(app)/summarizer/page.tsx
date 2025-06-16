
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText as FileTextIcon, AlertTriangle, Wand2, Type, Mic2, Presentation, Video as VideoIconLucide, FileUp, UploadCloud, Youtube, Key, Brain, Info, Sparkles, SendHorizonal, MessageSquare, ChevronRightSquare, Link as LinkIcon, Film, FolderClosed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeText, SummarizeTextInput, SummarizeTextOutput } from "@/ai/flows/summarize-text-flow";
import { aiGuidedStudySession, AIGuidedStudySessionInput, AIGuidedStudySessionOutput } from "@/ai/flows/ai-guided-study-session";
import { useUserProfile } from "@/contexts/user-profile-context";
import { cn } from "@/lib/utils";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"


type InputType = "text" | "recording" | "pdf" | "powerpoint" | "video";
type VideoInputMethod = 'url' | 'upload';

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
  { value: "pdf", label: "PDF", icon: FileTextIcon, title:"AI PDF Summarizer & Q&A", description: "Upload your PDF to get a summary, and then ask specific questions about its content. *AI responds based on filename and your questions.*", placeholder: "Upload your PDF document." },
  { value: "recording", label: "Audio", icon: Mic2, title:"AI Audio Note Taker", description: "Unpack lectures and meetings. Upload audio file, Sai (conceptually) transcribes and summarizes, pinpointing key discussions and insights. *AI responds based on filename.*", placeholder: "Upload your audio file (e.g., .mp3, .wav)." },
  { value: "powerpoint", label: "Slides", icon: Presentation, title:"AI Slide Summarizer & Q&A", description: "Ace presentations. Sai converts PPT or PDF slides into actionable study notes, detailing core messages, narrative flow, and key takeaways. *AI responds based on filename.*", placeholder: "Upload your PPT or PDF slide deck." },
  { value: "video", label: "Video", icon: VideoIconLucide, title:"AI Video Summarizer & Q&A", description: "Learn faster. Paste a YouTube link or upload a local video file. Sai (conceptually) summarizes key topics and allows Q&A. *AI responds based on URL/filename.*", placeholder: "https://www.youtube.com/watch?v=..." },
];

const MAX_CHARACTERS = 10000;
const MAX_LOCAL_VIDEO_SIZE_MB = 25; 

export default function SummarizerPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [inputText, setInputText] = useState<string>("");
  const [generatedNoteOutput, setGeneratedNoteOutput] = useState<SummarizeTextOutput | null>(null); 
  
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [pdfProcessingOutput, setPdfProcessingOutput] = useState<AIGuidedStudySessionOutput | null>(null);
  const [pdfQuestionHistory, setPdfQuestionHistory] = useState<Array<{ question: string; answer: string; id: string }>>([]);
  const [currentPdfQuestion, setCurrentPdfQuestion] = useState<string>("");
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);

  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [audioProcessingOutput, setAudioProcessingOutput] = useState<AIGuidedStudySessionOutput | null>(null);
  const [audioQuestionHistory, setAudioQuestionHistory] = useState<Array<{ question: string; answer: string; id: string }>>([]);
  const [currentAudioQuestion, setCurrentAudioQuestion] = useState<string>("");
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);

  const [uploadedSlideFile, setUploadedSlideFile] = useState<File | null>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const [slideProcessingOutput, setSlideProcessingOutput] = useState<AIGuidedStudySessionOutput | null>(null);
  const [slideQuestionHistory, setSlideQuestionHistory] = useState<Array<{ question: string; answer: string; id: string }>>([]);
  const [currentSlideQuestion, setCurrentSlideQuestion] = useState<string>("");
  const [isProcessingSlides, setIsProcessingSlides] = useState<boolean>(false);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [uploadedLocalVideoFile, setUploadedLocalVideoFile] = useState<File | null>(null);
  const localVideoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoProcessingOutput, setVideoProcessingOutput] = useState<AIGuidedStudySessionOutput | null>(null);
  const [videoQuestionHistory, setVideoQuestionHistory] = useState<Array<{ question: string; answer: string; id: string }>>([]);
  const [currentVideoQuestion, setCurrentVideoQuestion] = useState<string>("");
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [videoInputMethod, setVideoInputMethod] = useState<VideoInputMethod>('url');


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
  
  useEffect(() => {
    if (activeInputType !== 'pdf') {
      setUploadedPdfFile(null);
      setPdfProcessingOutput(null);
      setPdfQuestionHistory([]);
      setCurrentPdfQuestion("");
    }
    if (activeInputType !== 'recording') {
      setUploadedAudioFile(null);
      setAudioProcessingOutput(null);
      setAudioQuestionHistory([]);
      setCurrentAudioQuestion("");
    }
    if (activeInputType !== 'powerpoint') {
      setUploadedSlideFile(null);
      setSlideProcessingOutput(null);
      setSlideQuestionHistory([]);
      setCurrentSlideQuestion("");
    }
    if (activeInputType !== 'video') {
      setVideoUrl("");
      setUploadedLocalVideoFile(null);
      setVideoProcessingOutput(null);
      setVideoQuestionHistory([]);
      setCurrentVideoQuestion("");
      setVideoInputMethod('url');
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
        if(pdfFileInputRef.current) pdfFileInputRef.current.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Please upload a PDF smaller than 10MB.", variant: "destructive" });
        setUploadedPdfFile(null);
        if(pdfFileInputRef.current) pdfFileInputRef.current.value = "";
        return;
      }
      setUploadedPdfFile(file);
      setPdfProcessingOutput(null); 
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
    setIsProcessingPdf(true); 
    setError(null);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "PDF Content Summarization & Q&A",
        question: currentPdfQuestion,
        originalFileName: uploadedPdfFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setPdfProcessingOutput(result); 
      setPdfQuestionHistory(prev => [...prev, { question: currentPdfQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentPdfQuestion(""); 
      toast({ title: "Answer Received", description: "AI has responded to your question." });
    } catch (e) {
      console.error("PDF Q&A error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during PDF Q&A.";
      setError(errorMessage); 
      toast({ title: "PDF Q&A Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({ title: "Invalid File Type", description: "Please upload an audio file (e.g., MP3, WAV).", variant: "destructive" });
        setUploadedAudioFile(null);
        if(audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      if (file.size > 25 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Please upload an audio file smaller than 25MB.", variant: "destructive" });
        setUploadedAudioFile(null);
        if(audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      setUploadedAudioFile(file);
      setAudioProcessingOutput(null);
      setAudioQuestionHistory([]);
      setCurrentAudioQuestion("");
      setError(null);
      toast({ title: "Audio File Selected", description: `Ready to process "${file.name}".`});
    }
  };

  const handleSummarizeAudio = async () => {
    if (!uploadedAudioFile || !profile) {
      toast({ title: "Missing Input", description: "Please upload an audio file and ensure you are logged in.", variant: "destructive" });
      return;
    }
    setIsProcessingAudio(true);
    setError(null);
    setAudioProcessingOutput(null);
    setAudioQuestionHistory([]);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Audio Content Summarization & Q&A",
        question: `Summarize the audio: ${uploadedAudioFile.name}`,
        originalFileName: uploadedAudioFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setAudioProcessingOutput(result);
      toast({ title: "Audio Summary Generated", description: `Summary for "${uploadedAudioFile.name}" is ready.` });
    } catch (e) {
      console.error("Audio Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during audio summarization.";
      setError(errorMessage);
      toast({ title: "Audio Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleAskAudioQuestion = async () => {
    if (!currentAudioQuestion.trim() || !uploadedAudioFile || !profile) {
      toast({ title: "Missing Input", description: "Please type a question and ensure an audio file is loaded.", variant: "destructive" });
      return;
    }
    setIsProcessingAudio(true);
    setError(null);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Audio Content Summarization & Q&A",
        question: currentAudioQuestion,
        originalFileName: uploadedAudioFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setAudioProcessingOutput(result);
      setAudioQuestionHistory(prev => [...prev, { question: currentAudioQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentAudioQuestion("");
      toast({ title: "Answer Received", description: "AI has responded to your question about the audio." });
    } catch (e) {
      console.error("Audio Q&A error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during audio Q&A.";
      setError(errorMessage);
      toast({ title: "Audio Q&A Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSlideFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a PPT, PPTX, or PDF file for slides.", variant: "destructive" });
        setUploadedSlideFile(null);
        if(slideFileInputRef.current) slideFileInputRef.current.value = "";
        return;
      }
      if (file.size > 15 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Please upload a slide file smaller than 15MB.", variant: "destructive" });
        setUploadedSlideFile(null);
        if(slideFileInputRef.current) slideFileInputRef.current.value = "";
        return;
      }
      setUploadedSlideFile(file);
      setSlideProcessingOutput(null);
      setSlideQuestionHistory([]);
      setCurrentSlideQuestion("");
      setError(null);
      toast({ title: "Slide File Selected", description: `Ready to process "${file.name}".`});
    }
  };

  const handleSummarizeSlides = async () => {
    if (!uploadedSlideFile || !profile) {
      toast({ title: "Missing Input", description: "Please upload a slide file and ensure you are logged in.", variant: "destructive" });
      return;
    }
    setIsProcessingSlides(true);
    setError(null);
    setSlideProcessingOutput(null);
    setSlideQuestionHistory([]);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Slide Content Summarization & Q&A",
        question: `Summarize the slides: ${uploadedSlideFile.name}`,
        originalFileName: uploadedSlideFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setSlideProcessingOutput(result);
      toast({ title: "Slide Summary Generated", description: `Summary for "${uploadedSlideFile.name}" is ready.` });
    } catch (e) {
      console.error("Slide Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during slide summarization.";
      setError(errorMessage);
      toast({ title: "Slide Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingSlides(false);
    }
  };

  const handleAskSlideQuestion = async () => {
    if (!currentSlideQuestion.trim() || !uploadedSlideFile || !profile) {
      toast({ title: "Missing Input", description: "Please type a question and ensure a slide file is loaded.", variant: "destructive" });
      return;
    }
    setIsProcessingSlides(true);
    setError(null);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Slide Content Summarization & Q&A",
        question: currentSlideQuestion,
        originalFileName: uploadedSlideFile.name,
      };
      const result = await aiGuidedStudySession(aiInput);
      setSlideProcessingOutput(result);
      setSlideQuestionHistory(prev => [...prev, { question: currentSlideQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentSlideQuestion("");
      toast({ title: "Answer Received", description: "AI has responded to your question about the slides." });
    } catch (e) {
      console.error("Slide Q&A error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during slide Q&A.";
      setError(errorMessage);
      toast({ title: "Slide Q&A Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingSlides(false);
    }
  };

  const handleLocalVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({ title: "Invalid File Type", description: "Please upload a video file.", variant: "destructive" });
        setUploadedLocalVideoFile(null);
        if(localVideoFileInputRef.current) localVideoFileInputRef.current.value = "";
        return;
      }
      if (file.size > MAX_LOCAL_VIDEO_SIZE_MB * 1024 * 1024) { 
        toast({ title: "File too large", description: `Please upload a video smaller than ${MAX_LOCAL_VIDEO_SIZE_MB}MB.`, variant: "destructive" });
        setUploadedLocalVideoFile(null);
        if(localVideoFileInputRef.current) localVideoFileInputRef.current.value = "";
        return;
      }
      setUploadedLocalVideoFile(file);
      setVideoProcessingOutput(null);
      setVideoQuestionHistory([]);
      setCurrentVideoQuestion("");
      setError(null);
      toast({ title: "Video File Selected", description: `Ready to process "${file.name}".`});
    }
  };

  const handleSummarizeVideo = async () => {
    if (!profile) {
        toast({title: "Profile Missing", description: "Please ensure you are logged in.", variant: "destructive"});
        return;
    }
    if (videoInputMethod === 'url' && !videoUrl.trim()) {
      toast({ title: "Missing Input", description: "Please enter a YouTube video URL.", variant: "destructive" });
      return;
    }
    if (videoInputMethod === 'upload' && !uploadedLocalVideoFile) {
      toast({ title: "Missing Input", description: "Please upload a local video file.", variant: "destructive" });
      return;
    }

    setIsProcessingVideo(true);
    setError(null);
    setVideoProcessingOutput(null);
    setVideoQuestionHistory([]);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Video Content Summarization & Q&A",
        question: videoInputMethod === 'url' ? videoUrl : `Summarize the video: ${uploadedLocalVideoFile?.name}`,
        originalFileName: videoInputMethod === 'upload' ? uploadedLocalVideoFile?.name : undefined,
      };
      const result = await aiGuidedStudySession(aiInput);
      setVideoProcessingOutput(result);
      const sourceName = videoInputMethod === 'url' ? "the YouTube video" : `"${uploadedLocalVideoFile?.name}"`;
      toast({ title: "Video Summary Generated", description: `Summary for ${sourceName} is ready.` });
    } catch (e) {
      console.error("Video Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during video summarization.";
      setError(errorMessage);
      toast({ title: "Video Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingVideo(false);
    }
  };
  
  const handleAskVideoQuestion = async () => {
    if (!currentVideoQuestion.trim() || !profile || (!videoUrl.trim() && !uploadedLocalVideoFile)) {
      toast({ title: "Missing Input", description: "Please type a question and ensure a video source is provided.", variant: "destructive" });
      return;
    }
    setIsProcessingVideo(true);
    setError(null);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Video Content Summarization & Q&A",
        question: currentVideoQuestion,
        originalFileName: videoInputMethod === 'upload' ? uploadedLocalVideoFile?.name : (videoInputMethod === 'url' && videoUrl.trim() ? videoUrl : undefined),
      };
      const result = await aiGuidedStudySession(aiInput);
      setVideoProcessingOutput(result);
      setVideoQuestionHistory(prev => [...prev, { question: currentVideoQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentVideoQuestion("");
      toast({ title: "Answer Received", description: "AI has responded to your question about the video." });
    } catch (e) {
      console.error("Video Q&A error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during video Q&A.";
      setError(errorMessage);
      toast({ title: "Video Q&A Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingVideo(false);
    }
  };


  const handleMainGenerateClick = () => {
    if (activeInputType === "text") {
      handleSummarizeText();
    } else if (activeInputType === "pdf") {
      handleSummarizePdf();
    } else if (activeInputType === "recording") {
      handleSummarizeAudio();
    } else if (activeInputType === "powerpoint") {
      handleSummarizeSlides();
    } else if (activeInputType === "video") {
      handleSummarizeVideo();
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
                <Button variant="outline" size="sm" onClick={() => {/* Placeholder for file upload */}} className="text-xs">
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
                <input type="file" ref={pdfFileInputRef} onChange={handlePdfFileChange} accept=".pdf" className="hidden" id="pdf-upload-input" />
                <Button variant="outline" size="lg" onClick={() => pdfFileInputRef.current?.click()} className="mb-3">
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload PDF
                </Button>
                {uploadedPdfFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedPdfFile.name}</span></p>
                )}
                {!uploadedPdfFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB. AI will summarize based on filename and your questions.</p>
            </div>
        );
      case "recording":
        return (
            <div
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-xl min-h-[200px] bg-card shadow-sm"
            >
                <input type="file" ref={audioFileInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" id="audio-upload-input" />
                <Button variant="outline" size="lg" onClick={() => audioFileInputRef.current?.click()} className="mb-3">
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload Audio File
                </Button>
                {uploadedAudioFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedAudioFile.name}</span></p>
                )}
                {!uploadedAudioFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 25MB. Supported: MP3, WAV, M4A etc. AI will summarize based on filename.</p>
            </div>
        );
      case "powerpoint":
         return (
            <div
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-xl min-h-[200px] bg-card shadow-sm"
            >
                <input type="file" ref={slideFileInputRef} onChange={handleSlideFileChange} accept=".ppt,.pptx,.pdf" className="hidden" id="slide-upload-input" />
                <Button variant="outline" size="lg" onClick={() => slideFileInputRef.current?.click()} className="mb-3">
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload Slides (PPT, PDF)
                </Button>
                {uploadedSlideFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedSlideFile.name}</span></p>
                )}
                {!uploadedSlideFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 15MB. AI will summarize based on filename.</p>
            </div>
        );
      case "video":
        return (
            <div className="p-4 sm:p-6 border-2 border-dashed border-primary/30 rounded-xl bg-card shadow-sm">
                <RadioGroup value={videoInputMethod} onValueChange={(value: VideoInputMethod) => setVideoInputMethod(value)} className="flex space-x-4 mb-4 justify-center">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id="video-url" />
                        <Label htmlFor="video-url" className="flex items-center cursor-pointer"><Youtube className="mr-1.5 h-4 w-4 text-red-600"/>YouTube URL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="video-upload" />
                        <Label htmlFor="video-upload" className="flex items-center cursor-pointer"><FolderClosed className="mr-1.5 h-4 w-4 text-blue-500"/>Upload Local Video</Label>
                    </div>
                </RadioGroup>

                {videoInputMethod === 'url' && (
                    <div className="relative mb-2">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="url"
                            placeholder={currentInputTypeConfig.placeholder}
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="pl-10 text-sm h-11"
                            disabled={isLoading || isProcessingVideo} 
                            aria-label="YouTube video URL"
                        />
                    </div>
                )}
                {videoInputMethod === 'upload' && (
                     <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md bg-muted/30">
                        <input type="file" ref={localVideoFileInputRef} onChange={handleLocalVideoFileChange} accept="video/*" className="hidden" id="local-video-upload-input" />
                        <Button variant="secondary" size="sm" onClick={() => localVideoFileInputRef.current?.click()} className="mb-2">
                            <UploadCloud className="mr-2 h-4 w-4" /> Choose Local Video File
                        </Button>
                        {uploadedLocalVideoFile && (
                            <p className="text-xs text-muted-foreground">Selected: <span className="font-medium text-primary">{uploadedLocalVideoFile.name}</span></p>
                        )}
                        {!uploadedLocalVideoFile && <p className="text-xs text-muted-foreground">Max file size: {MAX_LOCAL_VIDEO_SIZE_MB}MB</p>}
                    </div>
                )}
                 <p className="text-xs text-muted-foreground mt-2 text-center">AI will summarize based on URL or filename.</p>
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
                setGeneratedNoteOutput(null); setError(null); setInputText("");
                setUploadedPdfFile(null); setPdfProcessingOutput(null); setPdfQuestionHistory([]); setCurrentPdfQuestion("");
                setUploadedAudioFile(null); setAudioProcessingOutput(null); setAudioQuestionHistory([]); setCurrentAudioQuestion("");
                setUploadedSlideFile(null); setSlideProcessingOutput(null); setSlideQuestionHistory([]); setCurrentSlideQuestion("");
                setVideoUrl(""); setUploadedLocalVideoFile(null); setVideoProcessingOutput(null); setVideoQuestionHistory([]); setCurrentVideoQuestion(""); setVideoInputMethod('url');
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
            disabled={isLoading || isProcessingPdf || isProcessingAudio || isProcessingSlides || isProcessingVideo ||
              (activeInputType === "text" && (!inputText.trim() || characterCount < 10 || characterCount > MAX_CHARACTERS)) ||
              (activeInputType === "pdf" && !uploadedPdfFile) ||
              (activeInputType === "recording" && !uploadedAudioFile) ||
              (activeInputType === "powerpoint" && !uploadedSlideFile) ||
              (activeInputType === "video" && ((videoInputMethod === 'url' && !videoUrl.trim()) || (videoInputMethod === 'upload' && !uploadedLocalVideoFile)))
            }
            size="lg"
            className="px-8 py-3 text-base"
            >
            {(isLoading || isProcessingPdf || isProcessingAudio || isProcessingSlides || isProcessingVideo) ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-5 w-5" />
            )}
            {activeInputType === 'pdf' ? "Summarize PDF & Start Q&A" 
              : activeInputType === 'recording' ? "Summarize Audio & Start Q&A" 
              : activeInputType === 'powerpoint' ? "Summarize Slides & Start Q&A"
              : activeInputType === 'video' ? "Summarize Video & Start Q&A"
              : "Generate Notes"}
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

            {pdfProcessingOutput && ( 
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

      {/* Display for Audio Summarization & Q&A Output */}
      {activeInputType === 'recording' && uploadedAudioFile && !isProcessingAudio && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Mic2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
              Audio Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={uploadedAudioFile.name}>{uploadedAudioFile.name}</span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your audio file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {audioProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">
                  {audioQuestionHistory.length === 0 ? "Summary:" : "Latest Answer:"}
                </h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                  {audioProcessingOutput.response}
                </div>
              </div>
            )}

            {audioProcessingOutput?.suggestions && audioProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:
                </h3>
                 <ul className="space-y-1.5">
                    {audioProcessingOutput.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs">
                        <Button
                            variant="link"
                            className="p-0 h-auto text-accent hover:text-accent/80 text-left"
                            onClick={() => {
                                setCurrentAudioQuestion(suggestion);
                            }}
                        >
                            <ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}
                        </Button>
                        </li>
                    ))}
                </ul>
              </div>
            )}
            
            {audioQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2">
                <div className="space-y-4">
                  {audioQuestionHistory.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p>
                      <p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </div>
            )}

            {audioProcessingOutput && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedAudioFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentAudioQuestion}
                    onChange={(e) => setCurrentAudioQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-grow"
                    disabled={isProcessingAudio}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentAudioQuestion.trim()) { e.preventDefault(); handleAskAudioQuestion(); } }}
                  />
                  <Button onClick={handleAskAudioQuestion} disabled={isProcessingAudio || !currentAudioQuestion.trim()}>
                    {isProcessingAudio && currentAudioQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>}
                    Ask
                  </Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>
                AI responses for audio are based on filename and your questions, not actual audio content processing.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display for Slide Summarization & Q&A Output */}
      {activeInputType === 'powerpoint' && uploadedSlideFile && !isProcessingSlides && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Presentation className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
              Slide Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={uploadedSlideFile.name}>{uploadedSlideFile.name}</span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your slide presentation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {slideProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">
                  {slideQuestionHistory.length === 0 ? "Summary:" : "Latest Answer:"}
                </h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                  {slideProcessingOutput.response}
                </div>
              </div>
            )}

            {slideProcessingOutput?.suggestions && slideProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:
                </h3>
                 <ul className="space-y-1.5">
                    {slideProcessingOutput.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs">
                        <Button
                            variant="link"
                            className="p-0 h-auto text-accent hover:text-accent/80 text-left"
                            onClick={() => {
                                setCurrentSlideQuestion(suggestion);
                            }}
                        >
                            <ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}
                        </Button>
                        </li>
                    ))}
                </ul>
              </div>
            )}
            
            {slideQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2">
                <div className="space-y-4">
                  {slideQuestionHistory.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p>
                      <p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </div>
            )}

            {slideProcessingOutput && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedSlideFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentSlideQuestion}
                    onChange={(e) => setCurrentSlideQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-grow"
                    disabled={isProcessingSlides}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentSlideQuestion.trim()) { e.preventDefault(); handleAskSlideQuestion(); } }}
                  />
                  <Button onClick={handleAskSlideQuestion} disabled={isProcessingSlides || !currentSlideQuestion.trim()}>
                    {isProcessingSlides && currentSlideQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>}
                    Ask
                  </Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>
                AI responses for slides are based on filename and your questions, not actual slide content processing.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display for Video Summarization & Q&A Output */}
      {activeInputType === 'video' && (videoUrl.trim() || uploadedLocalVideoFile) && !isProcessingVideo && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Film className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
              Video Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={videoInputMethod === 'url' ? videoUrl : uploadedLocalVideoFile?.name}>{videoInputMethod === 'url' ? videoUrl : uploadedLocalVideoFile?.name}</span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your video content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {videoProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">
                  {videoQuestionHistory.length === 0 ? "Summary:" : "Latest Answer:"}
                </h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">
                  {videoProcessingOutput.response}
                </div>
              </div>
            )}

            {videoProcessingOutput?.suggestions && videoProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:
                </h3>
                 <ul className="space-y-1.5">
                    {videoProcessingOutput.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs">
                        <Button
                            variant="link"
                            className="p-0 h-auto text-accent hover:text-accent/80 text-left"
                            onClick={() => {
                                setCurrentVideoQuestion(suggestion);
                            }}
                        >
                            <ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}
                        </Button>
                        </li>
                    ))}
                </ul>
              </div>
            )}
            
            {videoQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2">
                <div className="space-y-4">
                  {videoQuestionHistory.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p>
                      <p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </div>
            )}

            {videoProcessingOutput && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about the video:</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentVideoQuestion}
                    onChange={(e) => setCurrentVideoQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-grow"
                    disabled={isProcessingVideo}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentVideoQuestion.trim()) { e.preventDefault(); handleAskVideoQuestion(); } }}
                  />
                  <Button onClick={handleAskVideoQuestion} disabled={isProcessingVideo || !currentVideoQuestion.trim()}>
                    {isProcessingVideo && currentVideoQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>}
                    Ask
                  </Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>
                AI responses for videos are based on the URL/filename and your questions, not actual video content processing.
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

