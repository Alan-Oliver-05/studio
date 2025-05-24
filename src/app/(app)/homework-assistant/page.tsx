
"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PenSquare, RotateCcw, Search, Image as ImageIconLucide, UploadCloud, Calculator, Sparkles, FileQuestion, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { addMessageToConversation, getConversationById } from "@/lib/chat-storage";
import { aiGuidedStudySession, AIGuidedStudySessionInput } from "@/ai/flows/ai-guided-study-session";
import type { Message, UserProfile as UserProfileType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const subjectTags = ["Math", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "Economics"];

export default function HomeworkAssistantPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
  const [showInitialUI, setShowInitialUI] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImageDataUri, setUploadedImageDataUri] = useState<string | null>(null);
  const [isSubmittingInitialQuery, setIsSubmittingInitialQuery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation && conversation.topic === "Homework Help") {
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
        setShowInitialUI(false); 
        setSearchQuery(""); 
        setUploadedImageFile(null);
        setUploadedImageDataUri(null);
      } else {
        router.replace('/homework-assistant'); 
        initializeNewSession();
        setShowInitialUI(true);
      }
    } else {
      initializeNewSession();
      setShowInitialUI(true);
    }
  }, [searchParams, profile, router]);

  const initializeNewSession = () => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `homework-assist-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
    }
  };

  const handleNewSessionClick = () => {
    router.replace('/homework-assistant'); 
    initializeNewSession();
    setShowInitialUI(true);
    setSearchQuery("");
    setUploadedImageFile(null);
    setUploadedImageDataUri(null);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
        toast({ title: "Image too large", description: "Please upload an image smaller than 4MB.", variant: "destructive" });
        return;
      }
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImageDataUri(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInitialSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((!searchQuery.trim() && !uploadedImageFile) || !profile || !currentConversationId) {
      toast({ title: "Input required", description: "Please enter a question or upload an image.", variant: "destructive" });
      return;
    }
    setIsSubmittingInitialQuery(true);

    let userMessageText = searchQuery.trim();
    if (uploadedImageFile) {
      userMessageText = userMessageText ? `${userMessageText} (Context from uploaded image: ${uploadedImageFile.name})` : `(Context from uploaded image: ${uploadedImageFile.name})`;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(), sender: "user", text: userMessageText, timestamp: Date.now(), attachmentPreview: uploadedImageDataUri,
    };
    addMessageToConversation(currentConversationId, "Homework Help", userMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: {
          name: profile.name, age: Number(profile.age), gender: profile.gender, country: profile.country, state: profile.state, preferredLanguage: profile.preferredLanguage,
          educationQualification: {
            boardExam: profile.educationCategory === 'board' ? profile.educationQualification.boardExams : undefined,
            competitiveExam: profile.educationCategory === 'competitive' ? profile.educationQualification.competitiveExams : undefined,
            universityExam: profile.educationCategory === 'university' ? profile.educationQualification.universityExams : undefined,
          }
        },
        specificTopic: "Homework Help", question: searchQuery.trim(), photoDataUri: uploadedImageDataUri || undefined,
      };

      const aiResponse = await aiGuidedStudySession(aiInput);
      if (aiResponse && aiResponse.response) {
        const aiMessage: Message = {
          id: crypto.randomUUID(), sender: "ai", text: aiResponse.response, suggestions: aiResponse.suggestions, visualElement: aiResponse.visualElement, timestamp: Date.now(),
        };
        addMessageToConversation(currentConversationId, "Homework Help", aiMessage, profile);
      } else { throw new Error("AI response was empty or invalid."); }
    } catch (error) {
      console.error("Error getting initial AI response:", error);
      const errorText = error instanceof Error ? error.message : "Failed to get initial AI response.";
      toast({ title: "AI Error", description: errorText, variant: "destructive" });
      const errorMessage: Message = {
        id: crypto.randomUUID(), sender: "ai", text: `I encountered an error processing your initial request: ${errorText}. Please try rephrasing or starting a new session.`, timestamp: Date.now(),
      };
      addMessageToConversation(currentConversationId, "Homework Help", errorMessage, profile);
    } finally {
      setShowInitialUI(false);
      setIsSubmittingInitialQuery(false);
      setSearchQuery(""); 
      setUploadedImageFile(null);
      setUploadedImageDataUri(null);
    }
  };


  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Homework Assistant...</p>
      </div>
    );
  }

  if (!profile) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Homework Assistant, we need your profile information. Please complete the onboarding process first.
        </p>        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  const initialMessageForChat = `Hi ${profile.name}! I'm here to help with your homework. Ask me math problems, science questions, historical facts, or anything else you need step-by-step solutions or direct answers for. You can also upload an image of your problem.`;

  return (
    <div className="min-h-full flex flex-col pt-0 bg-gradient-to-br from-background via-muted/30 to-accent/10 dark:from-background dark:via-muted/10 dark:to-accent/5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 md:px-0 pt-0 mt-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <PenSquare className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Homework Helper
          </h1>
          <p className="text-muted-foreground mt-1">Get step-by-step solutions and answers to your homework questions.</p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Homework Session
        </Button>
      </div>

      {isSubmittingInitialQuery && (
        <div className="flex flex-col items-center justify-center flex-grow p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Getting your answer...</p>
        </div>
      )}

      {!isSubmittingInitialQuery && showInitialUI && (
        <div className="flex-grow flex flex-col items-center justify-start px-4 py-8">
          <div className="w-full max-w-3xl text-center">
             <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gradient-primary">
              Stuck on Homework?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Type your question or upload an image of your problem, and let our AI guide you to the solution!
            </p>

            <form onSubmit={handleInitialSubmit} className="mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-card rounded-full shadow-lg border border-border">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base h-11"
                  aria-label="Homework question input"
                />
                <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                      <ImageIconLucide className="h-5 w-5" />
                      <span className="sr-only">Upload image</span>
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" />
                    <Button type="submit" size="default" className="rounded-full px-6 text-base h-9">
                      <Search className="h-4 w-4 mr-2" /> Get Answer
                    </Button>
                </div>
              </div>
               {uploadedImageDataUri && (
                <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                  Image selected: <span className="font-medium">{uploadedImageFile?.name}</span>
                  <Image src={uploadedImageDataUri} alt="Preview" width={32} height={32} className="object-cover rounded border" />
                  <Button variant="ghost" size="sm" onClick={() => { setUploadedImageFile(null); setUploadedImageDataUri(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="text-xs text-destructive hover:text-destructive/80">Clear</Button>
                </div>
              )}
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-10">
              <div className="p-4 bg-card rounded-lg border shadow-sm">
                <FileQuestion className="h-6 w-6 text-primary mb-2"/>
                <h4 className="font-semibold text-foreground mb-1">Ask Anything</h4>
                <p className="text-xs text-muted-foreground">From complex math equations to historical event details.</p>
              </div>
              <div className="p-4 bg-card rounded-lg border shadow-sm">
                <Camera className="h-6 w-6 text-primary mb-2"/>
                <h4 className="font-semibold text-foreground mb-1">Snap & Solve</h4>
                <p className="text-xs text-muted-foreground">Upload images of handwritten problems or textbook questions.</p>
              </div>
              <div className="p-4 bg-card rounded-lg border shadow-sm">
                <Calculator className="h-6 w-6 text-primary mb-2"/>
                <h4 className="font-semibold text-foreground mb-1">Step-by-Step</h4>
                <p className="text-xs text-muted-foreground">Get detailed explanations and learn the method, not just the answer.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {subjectTags.map(tag => (
                <span key={tag} className="text-xs text-muted-foreground px-3 py-1 bg-card rounded-full shadow-sm border">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showInitialUI && chatKey && currentConversationId && (
        <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto px-0 md:px-4 pb-4">
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="Homework Help"
            conversationId={currentConversationId}
            initialSystemMessage={initialMessageForChat} 
            placeholderText="Ask another homework question or for clarification..."
          />
        </div>
      )}
    </div>
  );
}
    
