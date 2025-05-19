
"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PenSquare, RotateCcw, Search, Image as ImageIcon, UploadCloud, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { addMessageToConversation, getConversationById, saveConversation } from "@/lib/chat-storage";
import { aiGuidedStudySession, AIGuidedStudySessionInput } from "@/ai/flows/ai-guided-study-session";
import type { Message, UserProfile as UserProfileType } from "@/types";
import { useToast } from "@/hooks/use-toast";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const subjectTags = ["Math", "History", "Biology", "English", "Physics", "Chemistry"];

export default function HomeworkAssistantPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
  const [showSearchUI, setShowSearchUI] = useState(true); // New state to toggle UI

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
        setShowSearchUI(false); // If revisiting a session, show chat directly
        setSearchQuery(""); // Clear any stale search query
        setUploadedImageFile(null);
        setUploadedImageDataUri(null);
      } else {
        // Invalid session or not a homework help session, start fresh
        router.replace('/homework-assistant'); // Clear invalid sessionID
        initializeNewSession();
        setShowSearchUI(true);
      }
    } else {
      initializeNewSession();
      setShowSearchUI(true);
    }
  }, [searchParams, profile]);

  const initializeNewSession = () => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `homework-assistant-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
    }
  };

  const handleNewSessionClick = () => {
    router.replace('/homework-assistant'); // Clear any sessionID from URL
    initializeNewSession();
    setShowSearchUI(true);
    setSearchQuery("");
    setUploadedImageFile(null);
    setUploadedImageDataUri(null);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive",
        });
        return;
      }
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageDataUri(reader.result as string);
      };
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
      userMessageText = userMessageText ? `${userMessageText} (See attached image: ${uploadedImageFile.name})` : `(See attached image: ${uploadedImageFile.name})`;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
      attachmentPreview: uploadedImageDataUri,
    };

    addMessageToConversation(currentConversationId, "Homework Help", userMessage, profile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: {
          name: profile.name,
          age: Number(profile.age),
          gender: profile.gender,
          country: profile.country,
          state: profile.state,
          preferredLanguage: profile.preferredLanguage,
          educationQualification: {
            boardExam: profile.educationCategory === 'board' ? profile.educationQualification.boardExams : undefined,
            competitiveExam: profile.educationCategory === 'competitive' ? profile.educationQualification.competitiveExams : undefined,
            universityExam: profile.educationCategory === 'university' ? profile.educationQualification.universityExams : undefined,
          }
        },
        specificTopic: "Homework Help",
        question: searchQuery.trim(),
        photoDataUri: uploadedImageDataUri || undefined,
      };

      const aiResponse = await aiGuidedStudySession(aiInput);
      if (aiResponse && aiResponse.response) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: aiResponse.response,
          suggestions: aiResponse.suggestions,
          visualElement: aiResponse.visualElement,
          timestamp: Date.now(),
        };
        addMessageToConversation(currentConversationId, "Homework Help", aiMessage, profile);
      } else {
        throw new Error("AI response was empty or invalid.");
      }
    } catch (error) {
      console.error("Error getting initial AI response:", error);
      const errorText = error instanceof Error ? error.message : "Failed to get initial AI response.";
      toast({ title: "AI Error", description: errorText, variant: "destructive" });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: `I encountered an error processing your initial request: ${errorText}. Please try rephrasing or starting a new session.`,
        timestamp: Date.now(),
      };
      addMessageToConversation(currentConversationId, "Homework Help", errorMessage, profile);
    } finally {
      setShowSearchUI(false); // Transition to chat interface
      setIsSubmittingInitialQuery(false);
      // Keep searchQuery and uploadedImageFile for potential display above chat, or clear them
      // For now, we clear them as the chat interface will show the history.
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
    <div className="min-h-full flex flex-col pt-0 bg-gradient-to-br from-sky-100 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="flex justify-between items-center mb-6 px-4 md:px-6 pt-0 mt-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <PenSquare className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Homework Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Get help with your homework, assignments, and tricky questions.</p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> New Homework Session
        </Button>
      </div>

      {isSubmittingInitialQuery && (
        <div className="flex flex-col items-center justify-center flex-grow p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Getting your answer...</p>
        </div>
      )}

      {!isSubmittingInitialQuery && showSearchUI && (
        <div className="flex-grow flex flex-col items-center justify-start px-4 md:px-6 py-8 md:py-12">
          <div className="w-full max-w-3xl text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Homework Helper</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience AI-enhanced learning right away.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {subjectTags.map(tag => (
                <span key={tag} className="text-sm text-muted-foreground px-3 py-1 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-gray-200 dark:border-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            <form onSubmit={handleInitialSubmit} className="mb-10">
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-gray-200 dark:border-slate-600">
                <Search className="h-5 w-5 ml-2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Need answers? Enter your question or upload an image..."
                  className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
                />
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-5 w-5" />
                  <span className="sr-only">Upload image from search bar</span>
                </Button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" />
                <Button type="submit" size="lg" className="rounded-full px-6 text-base">
                  Search
                </Button>
                 <Button type="button" variant="outline" size="icon" className="rounded-full text-muted-foreground hover:text-primary border-gray-300 dark:border-slate-500">
                    <Calculator className="h-5 w-5" />
                    <span className="sr-only">Calculator or special input</span>
                 </Button>
              </div>
               {uploadedImageDataUri && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Image selected: {uploadedImageFile?.name} <img src={uploadedImageDataUri} alt="Preview" className="inline-block h-8 w-8 object-cover rounded ml-2" />
                </div>
              )}
            </form>

            <div
              className="w-full p-8 md:p-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/30 cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-1">Drag an Image here and get solution</p>
              <p className="text-sm text-muted-foreground">
                Or click to browse. <span className="font-mono bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">Command</span> + <span className="font-mono bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">V</span> to paste image (hint).
              </p>
            </div>
          </div>

          <div className="w-full max-w-4xl mt-16 text-left space-y-8">
            <h3 className="text-2xl font-semibold text-center text-primary mb-6">Key Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-accent mb-2">Real Homework Answers</h4>
                <p className="text-sm text-muted-foreground">
                  Search or upload questions and get high-quality AI-generated answers quickly. Simplify your study sessions with instant, one-click solutions.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-accent mb-2">Image Recognition</h4>
                <p className="text-sm text-muted-foreground">
                  Snap a photo of your homework question and our AI will provide you with the answer. This feature ensures you get help quickly, saving valuable study time.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-accent mb-2">Intelligent Content Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Harness the power of predictive AI with keyword extraction. The tool uses advanced algorithms to pinpoint the core components of your questions for accurate results.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showSearchUI && chatKey && currentConversationId && (
        <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto px-0 md:px-4 pb-4">
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="Homework Help"
            conversationId={currentConversationId}
            initialSystemMessage={initialMessageForChat} // This will be used if chat is empty
            placeholderText="Ask another homework question..."
          />
        </div>
      )}
    </div>
  );
}
    