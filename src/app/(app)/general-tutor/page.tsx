
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Sparkles, Edit, BookOpen, Code, Coffee, HelpCircle } from "lucide-react";
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

const suggestionChips = [
  { label: "Write", icon: Edit },
  { label: "Learn", icon: BookOpen },
  { label: "Code", icon: Code },
  { label: "Life stuff", icon: Coffee },
  { label: "EduAI's choice", icon: HelpCircle },
];

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
    <div className="h-full flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-16 pb-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground flex items-center justify-center">
          <Sparkles className="mr-2 h-7 w-7 sm:h-8 sm:w-8 text-orange-400" /> 
          {greetingName} returns!
        </h1>
      </div>
      
      <div className="w-full max-w-3xl flex flex-col items-center">
        {/* Chat Interface takes full width of its container */}
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

        {/* Suggestion Chips */}
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
                  // Placeholder: In a real app, this would set the input or trigger an action
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
