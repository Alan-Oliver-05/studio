
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Sparkles, Edit, BookOpen, RotateCcw, HelpCircle, Brain as BrainIcon } from "lucide-react";
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
        router.replace('/general-tutor'); 
        initializeNewSession();
      }
    } else if (profile) { 
      initializeNewSession();
    }
  }, [searchParams, profile, router, initializeNewSession]);


  const handleNewSessionClick = () => {
    initializeNewSession();
  };

  const getSuggestionChips = () => {
    const chips = [];
    // Chip for profile name
    if (profile?.name) {
      chips.push({ label: profile.name, icon: Sparkles }); 
    }
  
    // Other static chips
    const staticChipsConfig = [
      { label: "Write", icon: Edit },
      { label: "Learn", icon: BookOpen },
      { label: "EduAI's choice", icon: HelpCircle },
    ];
    staticChipsConfig.forEach(config => {
      chips.push({ label: config.label, icon: config.icon });
    });
    
    return chips;
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

  const initialMainChatMessage = `Hi ${profile.name}! How can I assist you today? Ask me anything, explore topics, or get help with your studies.`;
  
  return (
    <div className="min-h-full flex flex-col pt-0 bg-gradient-to-br from-background via-muted/30 to-accent/10 dark:from-background dark:via-muted/10 dark:to-accent/5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-1 md:px-0 pt-0 mt-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center mt-0">
            <BrainIcon className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> AI Learning Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal AI for learning and exploration.</p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" size="sm" className="mt-3 sm:mt-0 shadow-sm">
          <RotateCcw className="mr-2 h-4 w-4" /> New Conversation
        </Button>
      </div>
      
      <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col items-center">
        <div className="w-full flex-grow min-h-0">
            {chatKey && currentConversationId && ( 
            <DynamicChatInterface
                key={chatKey} 
                userProfile={profile}
                topic="AI Learning Assistant Chat" 
                conversationId={currentConversationId}
                initialSystemMessage={initialMainChatMessage}
                placeholderText="Ask me anything or explore a topic..."
                enableImageUpload={true} 
            />
            )}
        </div>

        <div className="mt-6 mb-4 flex flex-wrap justify-center gap-2 sm:gap-3">
          {getSuggestionChips().map((chip) => {
            const IconComponent = chip.icon;
            return (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                className="rounded-full px-3 py-1.5 h-auto text-xs sm:text-sm bg-card/80 hover:bg-muted/90 border-border shadow-sm"
                onClick={() => {
                  console.log(`Suggestion chip clicked: ${chip.label}`);
                  // Future: Implement logic to send this suggestion as a query
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

