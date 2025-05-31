
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Brain, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react"; 

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function GeneralTutorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(''); 


  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery); 
    } else if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const defaultId = `general-tutor-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId); 
    }
  }, [searchParams, profile]);

  const handleNewConversation = () => {
    router.push('/general-tutor', { scroll: false }); 
    if (profile) {
        const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
        const newTimestamp = Date.now();
        const newId = `general-tutor-${profileIdentifier}-${newTimestamp}`;
        setCurrentConversationId(newId);
        setChatKey(newId);
    }
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

  const initialMainChatMessage = `Hello ${profile.name}! I'm your AI Learning Assistant. Ask me any question about your studies, homework, or concepts you'd like to understand better. You can also upload an image for context. How can I help you today?`;
  
  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pt-0 mt-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
                <Brain className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> AI Learning Assistant
            </h1>
            <p className="text-muted-foreground mt-1">Your multi-modal personal tutor for general queries.</p>
        </div>
        <Button onClick={handleNewConversation} variant="outline" className="mt-2 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Conversation
        </Button>
      </div>
      <div className="flex-grow flex flex-col min-h-0 max-w-4xl w-full mx-auto">
        {chatKey && currentConversationId && ( // Ensure key and ID are set
          (<DynamicChatInterface
            key={chatKey} 
            userProfile={profile}
            topic="AI Learning Assistant Chat" // Specific topic for AI to recognize this mode
            conversationId={currentConversationId}
            initialSystemMessage={initialMainChatMessage}
            placeholderText="Ask anything or upload an image..."
          />)
        )}
      </div>
    </div>
  );
}
