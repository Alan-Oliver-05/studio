
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { ChatInterface } from "../study-session/components/chat-interface"; // Reusing the chat interface
import { Loader2, AlertTriangle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GeneralTutorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the General AI Tutor, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  const conversationId = `general-tutor-${profile.id || 'default'}`;
  const initialMessage = `Hello ${profile.name}! I'm your General AI Tutor. Feel free to ask me about any subject or topic you're curious about. How can I help you learn today?`;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Brain className="mr-3 h-8 w-8"/> General AI Tutor
        </h1>
        <p className="text-muted-foreground">A chat playground for general study information and exploring new topics.</p>
      </div>
      <div className="flex-grow">
        <ChatInterface
          userProfile={profile}
          topic="General AI Tutor"
          conversationId={conversationId}
          initialSystemMessage={initialMessage}
          placeholderText="Ask anything..."
        />
      </div>
    </div>
  );
}
