
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, MessagesSquare, RotateCcw } from "lucide-react"; // Changed icon
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { getConversationById } from "@/lib/chat-storage";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const CONVERSATION_TRANSLATION_TOPIC = "Language Conversation Practice";

export default function ConversationTranslatorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');

  const initializeNewSession = (profileIdentifier: string) => {
    const newTimestamp = Date.now();
    const newId = `lang-convo-${profileIdentifier}-${newTimestamp}`;
    setCurrentConversationId(newId);
    setChatKey(newId);
  };

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const storedConversation = getConversationById(sessionIdFromQuery);
      if (storedConversation && storedConversation.topic === CONVERSATION_TRANSLATION_TOPIC) {
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
      } else {
        router.replace('/conversation-translator');
        if (profile) {
          initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
        }
      }
    } else if (profile) {
      initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile, router]);

  const handleNewSession = () => {
    router.push('/conversation-translator', { scroll: false });
    if (profile) {
      initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Conversation Translator...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Conversation Translator, we need your profile information. Please complete the onboarding process first.
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
        <p className="mt-4 text-muted-foreground">Initializing conversation session...</p>
      </div>
    );
  }
  
  const initialChatMessage = `Hello ${profile.name}! Let's practice a conversation. Tell me the scenario, your role/language, and the role/language for me to simulate. For example: "I want to practice ordering food at a French cafe. I will be the customer speaking English, and you be the waiter speaking French."`;

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <MessagesSquare className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Conversation Translator
            </h1>
            <p className="text-muted-foreground mt-1">Practice bilingual conversations with AI assistance.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Conversation Practice
        </Button>
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
         {chatKey && currentConversationId && (
            <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={CONVERSATION_TRANSLATION_TOPIC} 
                conversationId={currentConversationId}
                initialSystemMessage={initialChatMessage}
                placeholderText="Start the conversation or give instructions..."
                enableImageUpload={false} 
            />
         )}
      </div>
    </div>
  );
}
