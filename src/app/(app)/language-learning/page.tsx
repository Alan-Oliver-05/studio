
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation'; 
import { useEffect, useState } from "react"; 


const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function LanguageLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(Date.now().toString());


  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
    } else if (profile?.id) {
      const defaultId = `language-learning-chat-${profile.id}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId);
    }
  }, [searchParams, profile?.id]);

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-0 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Language Learning Hub...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 pt-0 mt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Language Learning Hub, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

   if (!currentConversationId) {
     return (
      <div className="flex flex-col items-center justify-center h-full pt-0 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }
  
  const initialChatMessage = `Hello ${profile.name}! Welcome to the Language Learning Hub. Which language would you like to learn or practice today? I can help you with vocabulary, grammar, translations, and conversational practice.`;

  return (
    <div className="h-full flex flex-col mt-0 pt-0">
      <div className="mb-6 pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Learning Hub
        </h1>
        <p className="text-muted-foreground">Your personal AI language tutor.</p>
      </div>
      
      <div className="flex-grow min-h-0">
        <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="LanguageLearningMode" 
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessage}
            placeholderText="Type to practice your language skills..."
          />
      </div>
    </div>
  );
}
