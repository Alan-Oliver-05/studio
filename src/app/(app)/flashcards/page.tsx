"use client";

import React, { useState, useCallback, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileUp, AlertTriangle, Sparkles as SparklesIcon, Layers, HelpCircle, Settings2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/contexts/user-profile-context';
import type { UserProfile, DocumentFileCategory, Flashcard, MCQItem, Message as MessageType } from '@/types';
import { generateFlashcardsFromDocument, GenerateFlashcardsInput } from '@/ai/flows/generate-flashcards-from-document-flow';
import { generateMcqsFromDocument, GenerateMcqsInput } from '@/ai/flows/generate-mcqs-from-document-flow';
import FileUploadZone from './components/FileUploadZone';
import FlashcardViewer from './components/FlashcardViewer'; 
import McqQuizzer from './components/McqQuizzer'; 
import Link from "next/link";
import { addMessageToConversation } from '@/lib/chat-storage';


type ProcessingState = 
  | 'idle' 
  | 'file_selected' 
  | 'generating_flashcards' 
  | 'showing_flashcards' 
  | 'generating_mcqs' 
  | 'showing_mcqs'
  | 'error';

export default function FlashcardsPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState<DocumentFileCategory>('unknown');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setFlashcards([]);
    setMcqs([]);
    setErrorMessage(null);
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    let category: DocumentFileCategory = 'unknown';
    if (ext === 'pdf') category = 'pdf';
    else if (ext === 'doc' || ext === 'docx') category = 'docx';
    else if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) category = 'audio';
    else if (['ppt', 'pptx'].includes(ext || '')) category = 'slides';
    setFileCategory(category);

    setProcessingState('file_selected');
  }, []);

  const handleGenerateFlashcards = async () => {
    if (!selectedFile || !profile) {
      toast({ title: "Error", description: "Please select a file and ensure you are logged in.", variant: "destructive" });
      return;
    }
    setProcessingState('generating_flashcards');
    setErrorMessage(null);
    try {
      const input: GenerateFlashcardsInput = { documentName: selectedFile.name, documentType: fileCategory };
      const result = await generateFlashcardsFromDocument(input);
      if (result.flashcards && result.flashcards.length > 0) {
        setFlashcards(result.flashcards);
        setProcessingState('showing_flashcards');
        toast({ title: "Flashcards Generated!", description: `Created ${result.flashcards.length} flashcards based on "${selectedFile.name}".` });
        
        const conversationId = `flashcards-gen-${profile.id}-${selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
        const userMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'user', text: `Request for flashcards from: ${selectedFile.name} (Type: ${fileCategory})`, timestamp: Date.now(),
        };
        const aiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: `Generated ${result.flashcards.length} flashcards. First card front: "${result.flashcards[0]?.front || 'N/A'}"`, timestamp: Date.now(),
        };
        addMessageToConversation(conversationId, "Flashcard Generation", userMessage, profile);
        addMessageToConversation(conversationId, "Flashcard Generation", aiMessage, profile);

      } else {
        setErrorMessage("AI could not generate flashcards for this document. Please try a different file or topic.");
        setProcessingState('error');
        toast({ title: "No Flashcards", description: "The AI couldn't create flashcards from this document concept.", variant: "default" });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
      setErrorMessage(`Flashcard Generation Failed: ${errorMsg}`);
      setProcessingState('error');
      toast({ title: "Error", description: `Failed to generate flashcards: ${errorMsg}`, variant: "destructive" });
    }
  };

  const handleGenerateMcqs = async () => {
    if (!selectedFile || !profile) {
      toast({ title: "Error", description: "Please select a file and ensure you are logged in.", variant: "destructive" });
      return;
    }
    setProcessingState('generating_mcqs');
    setErrorMessage(null);
    try {
      const input: GenerateMcqsInput = { documentName: selectedFile.name, documentType: fileCategory };
      const result = await generateMcqsFromDocument(input);
      if (result.mcqs && result.mcqs.length > 0) {
        setMcqs(result.mcqs);
        setProcessingState('showing_mcqs');
        toast({ title: "MCQ Quiz Ready!", description: `Created ${result.mcqs.length} MCQs based on "${selectedFile.name}".` });

        const conversationId = `mcqs-gen-${profile.id}-${selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
        const userMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'user', text: `Request for MCQs from: ${selectedFile.name} (Type: ${fileCategory})`, timestamp: Date.now(),
        };
        const aiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: `Generated ${result.mcqs.length} MCQs. First question: "${result.mcqs[0]?.question || 'N/A'}"`, timestamp: Date.now(),
        };
        addMessageToConversation(conversationId, "MCQ Generation", userMessage, profile);
        addMessageToConversation(conversationId, "MCQ Generation", aiMessage, profile);

      } else {
        setErrorMessage("AI could not generate MCQs for this document. Please try a different file or topic.");
        setProcessingState('error');
        toast({ title: "No MCQs", description: "The AI couldn't create MCQs from this document concept.", variant: "default" });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
      setErrorMessage(`MCQ Generation Failed: ${errorMsg}`);
      setProcessingState('error');
      toast({ title: "Error", description: `Failed to generate MCQs: ${errorMsg}`, variant: "destructive" });
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setFileCategory('unknown');
    setFlashcards([]);
    setMcqs([]);
    setErrorMessage(null);
    setProcessingState('idle');
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading AI Flashcard Studio...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use AI Flashcards, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center pt-0 pb-8 bg-gradient-to-br from-background via-muted/20 to-primary/5 dark:from-background dark:via-slate-900/30 dark:to-primary/10">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="my-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary flex items-center justify-center">
            <SparklesIcon className="mr-3 h-8 w-8 sm:h-10 sm:w-10 text-accent" /> AI Flashcard Studio
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Upload your study materials and let AI create interactive flashcards or MCQ quizzes for you!
          </p>
        </div>

        {processingState === 'idle' && (
          <FileUploadZone onFileSelect={handleFileSelect} />
        )}

        {processingState === 'file_selected' && selectedFile && (
          <Card className="w-full max-w-md mx-auto shadow-xl border-primary/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">File Selected!</CardTitle>
              <CardDescription className="text-sm">
                <span className="font-medium text-primary truncate block max-w-xs mx-auto" title={selectedFile.name}>{selectedFile.name}</span>
                ({fileCategory !== 'unknown' ? fileCategory.toUpperCase() : 'File'})
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGenerateFlashcards} size="lg" variant="default" className="flex-1 shadow-md">
                <Layers className="mr-2 h-5 w-5" /> Create Flashcards
              </Button>
              <Button onClick={handleGenerateMcqs} size="lg" variant="secondary" className="flex-1 shadow-md">
                <HelpCircle className="mr-2 h-5 w-5" /> Start MCQ Quiz
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
                <Button variant="outline" onClick={resetAll} size="sm">Upload Different File</Button>
            </CardFooter>
          </Card>
        )}

        {(processingState === 'generating_flashcards' || processingState === 'generating_mcqs') && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <p className="text-xl font-semibold text-muted-foreground">
              AI is working its magic on "{selectedFile?.name || 'your document'}"...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {processingState === 'generating_flashcards' ? "Crafting insightful flashcards..." : "Preparing your challenging MCQs..."}
            </p>
          </div>
        )}

        {processingState === 'error' && errorMessage && (
          <Card className="w-full max-w-md mx-auto shadow-lg border-destructive/50 text-center py-8">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl text-destructive">Generation Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{errorMessage}</p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" onClick={resetAll}>Try Again with a New File</Button>
            </CardFooter>
          </Card>
        )}
        
        {processingState === 'showing_flashcards' && flashcards.length > 0 && (
          <div className="mt-8 w-full">
            <FlashcardViewer flashcards={flashcards} onReset={resetAll} documentName={selectedFile?.name || "Document"}/>
          </div>
        )}

        {processingState === 'showing_mcqs' && mcqs.length > 0 && (
           <div className="mt-8 w-full">
            <McqQuizzer mcqs={mcqs} onReset={resetAll} documentName={selectedFile?.name || "Document"}/>
          </div>
        )}
        
        { (processingState === 'showing_flashcards' || processingState === 'showing_mcqs') && 
          ( (processingState === 'showing_flashcards' && flashcards.length === 0) || (processingState === 'showing_mcqs' && mcqs.length === 0) ) &&
          !errorMessage && (
             <Card className="w-full max-w-md mx-auto shadow-lg text-center py-8 mt-8">
                <CardHeader>
                  <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <CardTitle className="text-xl">Nothing Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">The AI couldn't create any content for "{selectedFile?.name}". This might happen with very generic filenames or unsupported concepts.</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="outline" onClick={resetAll}>Try Again with a New File</Button>
                </CardFooter>
              </Card>
          )
        }

        <Card className="mt-10 bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center">
              <Download className="mr-2 h-5 w-5" /> Document Processing Note
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>This AI tool currently <strong className="text-primary">simulates document understanding</strong> based on the file's name and type (e.g., PDF, DOCX).</p>
            <p>It does not upload or analyze the actual content of your files for privacy and simplicity in this demo environment.</p>
            <p>The flashcards and MCQs generated are <strong className="text-primary">conceptually relevant</strong> to what such a document might contain.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
