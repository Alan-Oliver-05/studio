
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Sparkles, Edit, BookOpen, Code, Coffee, HelpCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from "react"; 
import { getConversationById } from "@/lib/chat-storage";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

const suggestionChips = [
  { label: "Write", icon: Edit },
  { label: "Learn", icon: BookOpen },
  // { label: "Code", icon: Code }, // Removed
  // { label: "Life stuff", icon: Coffee }, // Removed
  { label: "EduAI's choice", icon: HelpCircle },
];

export default function GeneralTutorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(''); 

  const initializeNewSession = useCallback(() => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `general-tutor-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId); 
      // Clear sessionId from URL if present, to ensure a truly new session
      if (searchParams.get('sessionId')) {
        router.replace('/general-tutor', { scroll: false });
      }
    }
  }, [profile, router, searchParams]);

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation && conversation.topic === "AI Learning Assistant Chat") {
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery); 
      } else {
        // If sessionId is invalid or not for this tutor, start new
        router.replace('/general-tutor'); 
        initializeNewSession();
      }
    } else if (profile) { // Only initialize if no session ID and profile exists
      initializeNewSession();
    }
  }, [searchParams, profile, router, initializeNewSession]);


  const handleNewSessionClick = () => {
    initializeNewSession();
  };


  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading AI Learning Assistant...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the AI Learning Assistant, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  if (!currentConversationId || !chatKey) {
     return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing chat session...</p>
      </div>
    );
  }

  const initialMainChatMessage = `Hi ${profile.name}! How can I assist you?`;
  const greetingName = profile.name || "EduAI Tutor";
  
  return (
    <div className="h-full flex flex-col items-center pt-6 sm:pt-8 pb-8 px-4">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center">
          <Sparkles className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-orange-400" /> 
          {greetingName} returns!
        </h1>
        <Button variant="outline" size="sm" onClick={handleNewSessionClick}>
            <RotateCcw className="mr-2 h-4 w-4" /> New Conversation
        </Button>
      </div>
      
      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="w-full">
            {chatKey && currentConversationId && ( 
            <DynamicChatInterface
                key={chatKey} 
                userProfile={profile}
                topic="AI Learning Assistant Chat" 
                conversationId={currentConversationId}
                initialSystemMessage={initialMainChatMessage}
                placeholderText="How can I help you today?"
                enableImageUpload={true} 
            />
            )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          {suggestionChips.map((chip) => {
            const IconComponent = chip.icon;
            return (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                className="rounded-full px-3 py-1.5 h-auto text-xs sm:text-sm bg-background hover:bg-muted/80"
                onClick={() => {
                  console.log(`Suggestion chip clicked: ${chip.label}`);
                }}
              >
                <IconComponent className="mr-1.5 h-4 w-4 text-muted-foreground" />
                {chip.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

