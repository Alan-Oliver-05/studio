
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { addMessageToConversation } from "@/lib/chat-storage";
import type { Message as MessageType } from "@/types";
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type InputType = "text" | "recording" | "pdf" | "powerpoint" | "video";
type VideoInputMethod = 'url' | 'upload';

interface InputTypeOption {
  value: InputType;
  label: string;
  icon: React.ElementType;
  description: string;
  placeholder: string;
  title: string;
  storageTopic: string;
}

const inputTypeOptions: InputTypeOption[] = [
  { value: "text", label: "Text", icon: Type, title:"AI Text Summarizer & Note Taker", description: "Paste any text — articles, essays, or research papers — and get concise summaries, key takeaways, and organized notes instantly.", placeholder: "Paste your article, essay, research paper, or any text here...", storageTopic: "Text Content Summarization" },
  { value: "pdf", label: "PDF", icon: FileTextIcon, title:"AI PDF Summarizer & Q&A", description: "Upload your PDF to get a summary based on its content, and then ask specific questions.", placeholder: "Upload your PDF document.", storageTopic: "PDF Content Summarization & Q&A" },
  { value: "recording", label: "Audio", icon: Mic2, title:"AI Audio Note Taker", description: "Unpack lectures and meetings. Upload an audio file, and the AI will provide a conceptual summary and answer questions based on the filename and topic.", placeholder: "Upload your audio file (e.g., .mp3, .wav).", storageTopic: "Audio Content Summarization & Q&A" },
  { value: "powerpoint", label: "Slides", icon: Presentation, title:"AI Slide Summarizer & Q&A", description: "Ace presentations. Upload PPT or PDF slides. If PDF, content is read. If PPT, AI conceptually analyzes from filename, detailing core messages and key takeaways.", placeholder: "Upload your PPT or PDF slide deck.", storageTopic: "Slide Content Summarization & Q&A" },
  { value: "video", label: "Video", icon: VideoIconLucide, title:"AI Video Summarizer & Q&A", description: "Learn faster. Paste a YouTube link to get a transcript summary and ask questions. You can also upload a local video file for conceptual analysis based on its filename.", placeholder: "https://www.youtube.com/watch?v=...", storageTopic: "Video Content Summarization & Q&A" },
];

const MAX_CHARACTERS = 10000;
const MAX_LOCAL_VIDEO_SIZE_MB = 25; 


const parsePdfContent = async (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            try {
                const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
                }
                resolve(textContent);
            } catch (error) {
                console.error('Error parsing PDF:', error);
                reject(new Error("Failed to parse PDF content. The file might be corrupted or encrypted."));
            }
        };
        reader.onerror = () => reject(new Error("Error reading file."));
        reader.readAsArrayBuffer(file);
    });
};


export default function SummarizerPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [inputText, setInputText] = useState<string>("");
  const [generatedNoteOutput, setGeneratedNoteOutput] = useState<SummarizeTextOutput | null>(null); 
  
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [pdfTextContent, setPdfTextContent] = useState<string>("");
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
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
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const [uploadedSlideFile, setUploadedSlideFile] = useState<File | null>(null);
  const [slideTextContent, setSlideTextContent] = useState<string>("");
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

  const [isLoading, setIsLoadingState] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeInputType, setActiveInputType] = useState<InputType>("text");
  const [characterCount, setCharacterCount] = useState<number>(0);
  
  const [currentMediaConversationId, setCurrentMediaConversationId] = useState<string | null>(null);


  const currentInputTypeConfig = inputTypeOptions.find(opt => opt.value === activeInputType) || inputTypeOptions[0];

  useEffect(() => {
    if (activeInputType === "text") {
      setCharacterCount(inputText.length);
    } else {
      setCharacterCount(0); 
    }
  }, [inputText, activeInputType]);
  
  useEffect(() => {
    setCurrentMediaConversationId(null); 
    if (activeInputType !== 'pdf') {
      setUploadedPdfFile(null);
      setPdfProcessingOutput(null);
      setPdfQuestionHistory([]);
      setCurrentPdfQuestion("");
      setPdfTextContent("");
    }
    if (activeInputType !== 'recording') {
      setUploadedAudioFile(null);
      setAudioProcessingOutput(null);
      setAudioQuestionHistory([]);
      setCurrentAudioQuestion("");
      setAudioDataUri(null);
    }
    if (activeInputType !== 'powerpoint') {
      setUploadedSlideFile(null);
      setSlideProcessingOutput(null);
      setSlideQuestionHistory([]);
      setCurrentSlideQuestion("");
      setSlideTextContent("");
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
    if (!profile) {
      toast({ title: "Profile Error", description: "User profile not found.", variant: "destructive" });
      return;
    }
    if (inputText.trim().length < 10) {
      toast({ title: "Input too short", description: "Please enter at least 10 characters.", variant: "destructive" });
      return;
    }
    if (inputText.length > MAX_CHARACTERS) {
      toast({ title: "Input too long", description: `Max ${MAX_CHARACTERS} characters. Current: ${inputText.length}.`, variant: "destructive" });
      return;
    }

    setIsLoadingState(true);
    setError(null);
    setGeneratedNoteOutput(null);

    try {
      const input: SummarizeTextInput = { textToSummarize: inputText };
      const result = await summarizeText(input);
      setGeneratedNoteOutput(result);
      toast({ title: "Note Generated", description: "Your content has been successfully processed." });
      
      const conversationId = `summarizer-text-${profile.id}-${Date.now()}`;
      const userMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'user', text: `Summarize text: "${inputText.substring(0, 100)}..."`, timestamp: Date.now(),
      };
      const aiMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.summary, suggestions: result.keywords, timestamp: Date.now(),
      };
      addMessageToConversation(conversationId, currentInputTypeConfig.storageTopic, userMessage, profile);
      addMessageToConversation(conversationId, currentInputTypeConfig.storageTopic, aiMessage, profile);

    } catch (e) {
      console.error("Summarization error:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Summarization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingState(false);
    }
  };

  const handlePdfFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Invalid File Type", description: "Please upload a PDF file.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Please upload a PDF smaller than 10MB.", variant: "destructive" });
        return;
      }

      setUploadedPdfFile(file);
      setPdfProcessingOutput(null); 
      setPdfQuestionHistory([]);
      setCurrentPdfQuestion("");
      setCurrentMediaConversationId(null);
      setError(null);
      setPdfTextContent("");

      setIsParsingPdf(true);
      toast({ title: "Parsing PDF...", description: `Extracting text from "${file.name}". This may take a moment.` });
      
      try {
        const text = await parsePdfContent(file);
        setPdfTextContent(text);
        toast({ title: "PDF Ready", description: `Successfully extracted text from "${file.name}".` });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({ title: "PDF Parsing Failed", description: errorMessage, variant: "destructive" });
        setUploadedPdfFile(null);
      } finally {
        setIsParsingPdf(false);
      }
    }
  };

  const handleSummarizePdf = async () => {
    if (!uploadedPdfFile || !profile || !pdfTextContent) {
      toast({ title: "Missing Input", description: "Please ensure a PDF is successfully parsed.", variant: "destructive" });
      return;
    }
    setIsProcessingPdf(true);
    setError(null);
    setPdfProcessingOutput(null);
    setPdfQuestionHistory([]);

    const newConversationId = `summarizer-pdf-${profile.id}-${uploadedPdfFile.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
    setCurrentMediaConversationId(newConversationId);

    const userPromptMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: `Summarize PDF: ${uploadedPdfFile.name}`, timestamp: Date.now()
    };
    addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, userPromptMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "PDF Content Summarization & Q&A",
        question: `Summarize the following document content from the file named "${uploadedPdfFile.name}".`,
        originalFileName: uploadedPdfFile.name,
        documentTextContent: pdfTextContent,
      };
      const result = await aiGuidedStudySession(aiInput);
      setPdfProcessingOutput(result);
      
      const aiResponseMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, aiResponseMessage, profile);
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
    if (!currentPdfQuestion.trim() || !uploadedPdfFile || !profile || !currentMediaConversationId || !pdfTextContent) {
      toast({ title: "Missing Input", description: "Please type a question and ensure a PDF has been processed.", variant: "destructive" });
      return;
    }
    setIsProcessingPdf(true); 
    setError(null);

    const userQuestionMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: currentPdfQuestion, timestamp: Date.now()
    };
    addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, userQuestionMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "PDF Content Summarization & Q&A",
        question: currentPdfQuestion,
        originalFileName: uploadedPdfFile.name,
        documentTextContent: pdfTextContent,
      };
      const result = await aiGuidedStudySession(aiInput);
      setPdfProcessingOutput(result); 
      setPdfQuestionHistory(prev => [...prev, { question: currentPdfQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentPdfQuestion(""); 
      
      const aiAnswerMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, aiAnswerMessage, profile);
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
      setCurrentMediaConversationId(null);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioDataUri(reader.result as string);
        toast({ title: "Audio File Loaded", description: `Ready to process "${file.name}".`});
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: `Could not read file "${file.name}".`, variant: "destructive" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSummarizeAudio = async () => {
    if (!uploadedAudioFile || !audioDataUri || !profile) {
      toast({ title: "Missing Input", description: "Please upload and load an audio file.", variant: "destructive" });
      return;
    }
    setIsProcessingAudio(true);
    setError(null);
    setAudioProcessingOutput(null);
    setAudioQuestionHistory([]);
    
    const newConversationId = `summarizer-audio-${profile.id}-${uploadedAudioFile.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
    setCurrentMediaConversationId(newConversationId);

    const userPromptMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: `Summarize audio: ${uploadedAudioFile.name}`, timestamp: Date.now()
    };
    addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, userPromptMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Audio Content Summarization & Q&A",
        question: `Summarize the audio content of the file named: ${uploadedAudioFile.name}`,
        originalFileName: uploadedAudioFile.name,
        audioDataUri: audioDataUri,
      };
      const result = await aiGuidedStudySession(aiInput);
      setAudioProcessingOutput(result);
      
      const aiResponseMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, aiResponseMessage, profile);
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
    if (!currentAudioQuestion.trim() || !uploadedAudioFile || !audioDataUri || !profile || !currentMediaConversationId) {
      toast({ title: "Missing Input", description: "Please type a question and ensure an audio file is processed.", variant: "destructive" });
      return;
    }
    setIsProcessingAudio(true);
    setError(null);

    const userQuestionMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: currentAudioQuestion, timestamp: Date.now()
    };
    addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, userQuestionMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Audio Content Summarization & Q&A",
        question: currentAudioQuestion,
        originalFileName: uploadedAudioFile.name,
        audioDataUri: audioDataUri,
      };
      const result = await aiGuidedStudySession(aiInput);
      setAudioProcessingOutput(result);
      setAudioQuestionHistory(prev => [...prev, { question: currentAudioQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentAudioQuestion("");

      const aiAnswerMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, aiAnswerMessage, profile);
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

  const handleSlideFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      setCurrentMediaConversationId(null);
      setError(null);
      setSlideTextContent("");

      if (file.type === "application/pdf") {
        setIsParsingPdf(true); // Reuse loader
        toast({ title: "Parsing PDF Slides...", description: `Extracting text from "${file.name}". This may take a moment.` });
        try {
            const text = await parsePdfContent(file);
            setSlideTextContent(text);
            toast({ title: "PDF Slides Ready", description: `Successfully extracted text from "${file.name}".` });
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            toast({ title: "PDF Parsing Failed", description: errorMessage, variant: "destructive" });
            setUploadedSlideFile(null);
        } finally {
            setIsParsingPdf(false);
        }
      } else {
        toast({ title: "Slide File Selected", description: `Ready to process "${file.name}". AI will analyze conceptually based on filename.`});
      }
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

    const newConversationId = `summarizer-slides-${profile.id}-${uploadedSlideFile.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
    setCurrentMediaConversationId(newConversationId);

    const userPromptMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: `Summarize slides: ${uploadedSlideFile.name}`, timestamp: Date.now()
    };
    addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, userPromptMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Slide Content Summarization & Q&A",
        question: `Summarize the slides: ${uploadedSlideFile.name}`,
        originalFileName: uploadedSlideFile.name,
        documentTextContent: slideTextContent || undefined,
      };
      const result = await aiGuidedStudySession(aiInput);
      setSlideProcessingOutput(result);
      
      const aiResponseMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, aiResponseMessage, profile);
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
    if (!currentSlideQuestion.trim() || !uploadedSlideFile || !profile || !currentMediaConversationId) {
      toast({ title: "Missing Input", description: "Please type a question, ensure a slide file is loaded, and session active.", variant: "destructive" });
      return;
    }
    setIsProcessingSlides(true);
    setError(null);

    const userQuestionMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: currentSlideQuestion, timestamp: Date.now()
    };
    addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, userQuestionMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Slide Content Summarization & Q&A",
        question: currentSlideQuestion,
        originalFileName: uploadedSlideFile.name,
        documentTextContent: slideTextContent || undefined,
      };
      const result = await aiGuidedStudySession(aiInput);
      setSlideProcessingOutput(result);
      setSlideQuestionHistory(prev => [...prev, { question: currentSlideQuestion, answer: result.response, id: crypto.randomUUID() }]);
      setCurrentSlideQuestion("");

      const aiAnswerMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, aiAnswerMessage, profile);
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
      setCurrentMediaConversationId(null);
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
    
    const videoIdentifier = videoInputMethod === 'url' ? videoUrl : uploadedLocalVideoFile?.name.replace(/[^a-zA-Z0-9]/g, '_');
    const newConversationId = `summarizer-video-${profile.id}-${videoIdentifier}-${Date.now()}`;
    setCurrentMediaConversationId(newConversationId);

    const userPromptMessageText = videoInputMethod === 'url' ? `Summarize YouTube video: ${videoUrl}` : `Summarize local video: ${uploadedLocalVideoFile?.name}`;
    const userPromptMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: userPromptMessageText, timestamp: Date.now()
    };
    addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, userPromptMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...profile, age: Number(profile.age) },
        specificTopic: "Video Content Summarization & Q&A",
        question: videoInputMethod === 'url' ? videoUrl : `Summarize the video: ${uploadedLocalVideoFile?.name}`,
        originalFileName: videoInputMethod === 'upload' ? uploadedLocalVideoFile?.name : undefined,
      };
      const result = await aiGuidedStudySession(aiInput);
      setVideoProcessingOutput(result);
      
      const aiResponseMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(newConversationId, currentInputTypeConfig.storageTopic, aiResponseMessage, profile);
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
    if (!currentVideoQuestion.trim() || !profile || (!videoUrl.trim() && !uploadedLocalVideoFile) || !currentMediaConversationId) {
      toast({ title: "Missing Input", description: "Please type a question, ensure a video source is provided and session active.", variant: "destructive" });
      return;
    }
    setIsProcessingVideo(true);
    setError(null);

    const userQuestionMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user', text: currentVideoQuestion, timestamp: Date.now()
    };
    addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, userQuestionMessage, profile);

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
      
      const aiAnswerMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: result.response, suggestions: result.suggestions, timestamp: Date.now()
      };
      addMessageToConversation(currentMediaConversationId, currentInputTypeConfig.storageTopic, aiAnswerMessage, profile);
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
                <Button variant="outline" size="lg" onClick={() => pdfFileInputRef.current?.click()} className="mb-3" disabled={isParsingPdf}>
                    {isParsingPdf ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                    {isParsingPdf ? "Parsing PDF..." : "Upload PDF"}
                </Button>
                {uploadedPdfFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedPdfFile.name}</span></p>
                )}
                {!uploadedPdfFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB. Content will be processed in-browser.</p>
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
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 25MB. Supported: MP3, WAV, M4A etc. Audio content is processed by AI.</p>
            </div>
        );
      case "powerpoint":
         return (
            <div
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-xl min-h-[200px] bg-card shadow-sm"
            >
                <input type="file" ref={slideFileInputRef} onChange={handleSlideFileChange} accept=".ppt,.pptx,.pdf" className="hidden" id="slide-upload-input" />
                <Button variant="outline" size="lg" onClick={() => slideFileInputRef.current?.click()} className="mb-3" disabled={isParsingPdf}>
                    {isParsingPdf ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                    Upload Slides (PPT, PDF)
                </Button>
                {uploadedSlideFile && (
                    <p className="text-sm text-muted-foreground mb-2">Selected: <span className="font-medium text-primary">{uploadedSlideFile.name}</span></p>
                )}
                {!uploadedSlideFile && <p className="text-xs text-muted-foreground">{currentInputTypeConfig.placeholder}</p>}
                 <p className="text-xs text-muted-foreground mt-2">Max file size: 15MB. PDF content will be read; PPT/PPTX will be analyzed by filename.</p>
            </div>
        );
      case "video":
        return (
            <div className="p-4 sm:p-6 border-2 border-dashed border-primary/30 rounded-xl bg-card shadow-sm">
                <RadioGroup value={videoInputMethod} onValueChange={(value: string) => setVideoInputMethod(value as VideoInputMethod)} className="flex space-x-4 mb-4 justify-center">
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
                 <p className="text-xs text-muted-foreground mt-2 text-center">AI will analyze YouTube URLs via transcript, and local videos conceptually by filename.</p>
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
                setUploadedAudioFile(null); setAudioProcessingOutput(null); setAudioQuestionHistory([]); setCurrentAudioQuestion(""); setAudioDataUri(null);
                setUploadedSlideFile(null); setSlideProcessingOutput(null); setSlideQuestionHistory([]); setCurrentSlideQuestion(""); setSlideTextContent("");
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
            disabled={isLoading || isProcessingPdf || isProcessingAudio || isProcessingSlides || isProcessingVideo || isParsingPdf ||
              (activeInputType === "text" && (!inputText.trim() || characterCount < 10 || characterCount > MAX_CHARACTERS)) ||
              (activeInputType === "pdf" && (!uploadedPdfFile || !pdfTextContent)) ||
              (activeInputType === "recording" && !uploadedAudioFile) ||
              (activeInputType === "powerpoint" && !uploadedSlideFile) ||
              (activeInputType === "video" && ((videoInputMethod === 'url' && !videoUrl.trim()) || (videoInputMethod === 'upload' && !uploadedLocalVideoFile)))
            }
            size="lg"
            className="px-8 py-3 text-base"
            >
            {(isLoading || isProcessingPdf || isProcessingAudio || isProcessingSlides || isProcessingVideo || isParsingPdf) ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-5 w-5" />
            )}
            {activeInputType === 'text' ? "Generate Notes"
              : activeInputType === 'pdf' ? "Summarize PDF & Start Q&A" 
              : activeInputType === 'recording' ? "Summarize Audio & Start Q&A" 
              : activeInputType === 'powerpoint' ? "Summarize Slides & Start Q&A"
              : activeInputType === 'video' ? "Summarize Video & Start Q&A"
              : "Generate"
            }
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

      {/* Q&A UI for PDF */}
      {activeInputType === 'pdf' && uploadedPdfFile && !isProcessingPdf && !isParsingPdf && (pdfProcessingOutput || pdfQuestionHistory.length > 0) && (
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
                  {pdfQuestionHistory.length === 0 && !currentPdfQuestion ? "Summary:" : "Latest Answer:"}
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
                        <Button variant="link" className="p-0 h-auto text-accent hover:text-accent/80 text-left" onClick={() => setCurrentPdfQuestion(suggestion)}>
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
                <ScrollArea className="max-h-60 pr-2"><div className="space-y-4">
                  {pdfQuestionHistory.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p>
                      <p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p>
                    </div>
                  ))}
                </div></ScrollArea>
              </div>
            )}
            {(pdfProcessingOutput || pdfQuestionHistory.length > 0) && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedPdfFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input value={currentPdfQuestion} onChange={(e) => setCurrentPdfQuestion(e.target.value)} placeholder="Type your question here..." className="flex-grow" disabled={isProcessingPdf} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentPdfQuestion.trim()) { e.preventDefault(); handleAskPdfQuestion(); } }}/>
                  <Button onClick={handleAskPdfQuestion} disabled={isProcessingPdf || !currentPdfQuestion.trim()}>
                    {isProcessingPdf && currentPdfQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>} Ask
                  </Button>
                </div>
              </div>
            )}
             <div className="text-xs text-muted-foreground pt-4 border-t mt-2">
                <Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/> AI responses for PDFs are based on the extracted text content. Processing is done in your browser.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Q&A UI for Audio */}
      {activeInputType === 'recording' && uploadedAudioFile && !isProcessingAudio && (audioProcessingOutput || audioQuestionHistory.length > 0) && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Mic2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/> Audio Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={uploadedAudioFile.name}>{uploadedAudioFile.name}</span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your audio file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {audioProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">{audioQuestionHistory.length === 0 && !currentAudioQuestion ? "Summary:" : "Latest Answer:"}</h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">{audioProcessingOutput.response}</div>
              </div>
            )}
            {audioProcessingOutput?.suggestions && audioProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center"><Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:</h3>
                <ul className="space-y-1.5">{audioProcessingOutput.suggestions.map((suggestion, idx) => (<li key={idx} className="text-xs"><Button variant="link" className="p-0 h-auto text-accent hover:text-accent/80 text-left" onClick={() => setCurrentAudioQuestion(suggestion)}><ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}</Button></li>))}</ul>
              </div>
            )}
            {audioQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2"><div className="space-y-4">{audioQuestionHistory.map(item => (<div key={item.id} className="text-sm"><p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p><p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p></div>))}</div></ScrollArea>
              </div>
            )}
            {(audioProcessingOutput || audioQuestionHistory.length > 0) && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedAudioFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input value={currentAudioQuestion} onChange={(e) => setCurrentAudioQuestion(e.target.value)} placeholder="Type your question here..." className="flex-grow" disabled={isProcessingAudio} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentAudioQuestion.trim()) { e.preventDefault(); handleAskAudioQuestion(); } }}/>
                  <Button onClick={handleAskAudioQuestion} disabled={isProcessingAudio || !currentAudioQuestion.trim()}>{isProcessingAudio && currentAudioQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>} Ask</Button>
                </div>
              </div>
            )}
             <div className="text-xs text-muted-foreground pt-4 border-t mt-2"><Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>AI responses for audio are based on the audio content itself. This feature requires processing the audio file.</div>
          </CardContent>
        </Card>
      )}

      {/* Q&A UI for Slides */}
      {activeInputType === 'powerpoint' && uploadedSlideFile && !isProcessingSlides && (slideProcessingOutput || slideQuestionHistory.length > 0) && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Presentation className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>Slide Analysis: <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[200px] sm:max-w-xs" title={uploadedSlideFile.name}>{uploadedSlideFile.name}</span></CardTitle>
            <CardDescription>AI summary and Q&A for your slide presentation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {slideProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">{slideQuestionHistory.length === 0 && !currentSlideQuestion ? "Summary:" : "Latest Answer:"}</h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">{slideProcessingOutput.response}</div>
              </div>
            )}
            {slideProcessingOutput?.suggestions && slideProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center"><Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:</h3>
                <ul className="space-y-1.5">{slideProcessingOutput.suggestions.map((suggestion, idx) => (<li key={idx} className="text-xs"><Button variant="link" className="p-0 h-auto text-accent hover:text-accent/80 text-left" onClick={() => setCurrentSlideQuestion(suggestion)}><ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}</Button></li>))}</ul>
              </div>
            )}
            {slideQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2"><div className="space-y-4">{slideQuestionHistory.map(item => (<div key={item.id} className="text-sm"><p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p><p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p></div>))}</div></ScrollArea>
              </div>
            )}
            {(slideProcessingOutput || slideQuestionHistory.length > 0) && (
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about "{uploadedSlideFile.name}":</h3>
                <div className="flex items-center gap-2">
                  <Input value={currentSlideQuestion} onChange={(e) => setCurrentSlideQuestion(e.target.value)} placeholder="Type your question here..." className="flex-grow" disabled={isProcessingSlides} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentSlideQuestion.trim()) { e.preventDefault(); handleAskSlideQuestion(); } }}/>
                  <Button onClick={handleAskSlideQuestion} disabled={isProcessingSlides || !currentSlideQuestion.trim()}>{isProcessingSlides && currentSlideQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>} Ask</Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2"><Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>AI responses for PDF slides are based on extracted content. Responses for PPT/PPTX are based on the filename.</div>
          </CardContent>
        </Card>
      )}

       {/* Q&A UI for Video */}
      {activeInputType === 'video' && (videoUrl.trim() || uploadedLocalVideoFile) && !isProcessingVideo && (videoProcessingOutput || videoQuestionHistory.length > 0) && (
        <Card className="mt-8 shadow-lg max-w-3xl mx-auto bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Film className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>Video Analysis: 
              <span className="ml-2 font-normal text-lg text-muted-foreground truncate max-w-[150px] sm:max-w-xs" title={videoUrl || uploadedLocalVideoFile?.name}>
                {videoUrl || uploadedLocalVideoFile?.name}
              </span>
            </CardTitle>
            <CardDescription>AI summary and Q&A for your video.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {videoProcessingOutput?.response && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5">{videoQuestionHistory.length === 0 && !currentVideoQuestion ? "Transcript Analysis:" : "Latest Answer:"}</h3>
                <div className="p-3.5 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed shadow-inner">{videoProcessingOutput.response}</div>
              </div>
            )}
            {videoProcessingOutput?.suggestions && videoProcessingOutput.suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1.5 flex items-center"><Sparkles className="mr-2 h-4 w-4 text-accent"/>Suggested Questions:</h3>
                <ul className="space-y-1.5">{videoProcessingOutput.suggestions.map((suggestion, idx) => (<li key={idx} className="text-xs"><Button variant="link" className="p-0 h-auto text-accent hover:text-accent/80 text-left" onClick={() => setCurrentVideoQuestion(suggestion)}><ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70 flex-shrink-0"/>{suggestion}</Button></li>))}</ul>
              </div>
            )}
            {videoQuestionHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-2">Q&A History:</h3>
                <ScrollArea className="max-h-60 pr-2"><div className="space-y-4">{videoQuestionHistory.map(item => (<div key={item.id} className="text-sm"><p className="font-medium text-muted-foreground flex items-center"><MessageSquare className="h-4 w-4 mr-1.5 text-accent"/>Q: {item.question}</p><p className="mt-1 pl-5 text-foreground whitespace-pre-wrap">A: {item.answer}</p></div>))}</div></ScrollArea>
              </div>
            )}
            {(videoProcessingOutput || videoQuestionHistory.length > 0) && ( 
              <div className="pt-6 border-t">
                 <h3 className="font-semibold text-lg text-primary mb-2">Ask a follow-up question about the video:</h3>
                <div className="flex items-center gap-2">
                  <Input value={currentVideoQuestion} onChange={(e) => setCurrentVideoQuestion(e.target.value)} placeholder="Type your question here..." className="flex-grow" disabled={isProcessingVideo} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && currentVideoQuestion.trim()) { e.preventDefault(); handleAskVideoQuestion(); } }}/>
                  <Button onClick={handleAskVideoQuestion} disabled={isProcessingVideo || !currentVideoQuestion.trim()}>{isProcessingVideo && currentVideoQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendHorizonal className="mr-2 h-4 w-4"/>} Ask</Button>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-4 border-t mt-2"><Info className="inline h-3.5 w-3.5 mr-1.5 align-middle"/>AI responses are based on the video's public transcript. If no transcript is available, the AI cannot provide a summary.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
