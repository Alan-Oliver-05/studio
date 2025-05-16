
"use client";

import { useState } from "react"; // Added useState
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PenSquare, RotateCcw } from "lucide-react"; // Added RotateCcw
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function HomeworkAssistantPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [sessionTimestamp, setSessionTimestamp] = useState(Date.now()); // Added sessionTimestamp state

  const handleNewSession = () => {
    setSessionTimestamp(Date.now()); // Update timestamp to start a new session
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

  // Incorporate sessionTimestamp into conversationId to make it unique per session
  const conversationId = `homework-assistant-${profile.id || 'default'}-${sessionTimestamp}`;
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
          key={sessionTimestamp} // Force re-mount of ChatInterface on new session
          userProfile={profile}
          topic="Homework Help" // This topic identifies it as a homework session in localStorage
          conversationId={conversationId}
          initialSystemMessage={initialMessage}
          placeholderText="Describe your homework problem or ask a question..."
        />
      </div>
    </div>
  );
}
