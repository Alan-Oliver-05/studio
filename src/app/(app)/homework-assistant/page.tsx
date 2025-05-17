
"use client";

import { useState, useEffect } from "react"; 
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PenSquare, RotateCcw } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function HomeworkAssistantPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter(); // Added router
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(Date.now());


  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(Number(sessionIdFromQuery.split('-').pop()) || Date.now()); // Use timestamp from ID or new one
    } else if (profile?.id) {
      const newTimestamp = Date.now();
      setCurrentConversationId(`homework-assistant-${profile.id}-${newTimestamp}`);
      setChatKey(newTimestamp);
    }
  }, [searchParams, profile?.id]);


  const handleNewSession = () => {
    // Navigate to the base page to clear query params, then generate new ID
    router.push('/homework-assistant', { scroll: false }); // scroll:false to prevent scroll jump
    if (profile?.id) {
        const newTimestamp = Date.now();
        setCurrentConversationId(`homework-assistant-${profile.id}-${newTimestamp}`);
        setChatKey(newTimestamp);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  if (!currentConversationId) {
    return (
        <div className="flex items-center justify-center h-full mt-0 pt-0">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-2">Initializing session...</p>
        </div>
    );
  }

  const initialMessage = `Hi ${profile.name}! I'm here to help with your homework. Ask me math problems, science questions, historical facts, or anything else you need step-by-step solutions or direct answers for. You can also upload an image of your problem.`;

  return (
    <div className="h-full flex flex-col mt-0 pt-0">
      <div className="flex justify-between items-center mb-6 pt-0 mt-0">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <PenSquare className="mr-3 h-8 w-8"/> Homework Assistant
            </h1>
            <p className="text-muted-foreground">Get help with your homework, assignments, and tricky questions.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> New Homework Session
        </Button>
      </div>
      <div className="flex-grow min-h-0">
        <DynamicChatInterface
          key={chatKey} 
          userProfile={profile}
          topic="Homework Help" 
          conversationId={currentConversationId}
          initialSystemMessage={initialMessage}
          placeholderText="Describe your homework problem or ask a question..."
        />
      </div>
    </div>
  );
}

    