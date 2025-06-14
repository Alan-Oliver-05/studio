
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
      // If navigating here to start new, ensure URL reflects no specific session
      if (searchParams.get('sessionId')) {
        router.replace('/general-tutor', { scroll: false });
      }
    }
  }, [profile, router, searchParams]);

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      // Ensure the loaded session is actually a general tutor session
      if (conversation && conversation.topic === "AI Learning Assistant Chat") {
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery); 
      } else {
        // If sessionId is invalid or for a different type, start new session
        router.replace('/general-tutor'); // Clear invalid sessionId from URL
        initializeNewSession();
      }
    } else if (profile) { 
      // No sessionId, and profile is loaded, so initialize a new session
      initializeNewSession();
    }
  }, [searchParams, profile, router, initializeNewSession]);


  // This function would be used if we re-add an explicit "New Session" button
  // For now, new sessions are started by navigating to the page without a sessionId
  // const handleNewSessionClick = () => {
  //   initializeNewSession();
  // };

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

  const initialMainChatMessage = `Hi ${profile.name}! How can I assist you?`;
  
  return (
    <div className="min-h-full flex flex-col items-center pt-6 sm:pt-10 bg-background">
      <div className="w-full max-w-3xl mx-auto text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center justify-center">
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-accent mr-2" />
          {profile?.name ? `${profile.name} returns!` : 'EduAI Tutor'}
        </h1>
      </div>
      
      <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col items-center px-4">
        <div className="w-full flex-grow min-h-0">
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

        <div className="mt-6 mb-4 flex flex-wrap justify-center gap-2 sm:gap-3">
          {getSuggestionChips().map((chip) => {
            const IconComponent = chip.icon;
            return (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                className="rounded-full px-3 py-1.5 h-auto text-xs sm:text-sm bg-card hover:bg-muted/90 border-border shadow-sm"
                onClick={() => {
                  // In a real app, this would send the chip.label as a query
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

