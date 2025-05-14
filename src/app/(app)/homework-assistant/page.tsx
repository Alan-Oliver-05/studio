
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { ChatInterface } from "../study-session/components/chat-interface"; // Reusing the chat interface
import { Loader2, AlertTriangle, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomeworkAssistantPage() {
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
          To use the Homework Assistant, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  const conversationId = `homework-assistant-${profile.id || 'default'}`;
  const initialMessage = `Hi ${profile.name}! I'm here to help with your homework and assignments. What problem are you working on?`;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 pt-0">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <PenSquare className="mr-3 h-8 w-8"/> Homework Assistant
        </h1>
        <p className="text-muted-foreground">Get help with your homework, assignments, and tricky questions.</p>
      </div>
      <div className="flex-grow">
        <ChatInterface
          userProfile={profile}
          topic="Homework Help"
          conversationId={conversationId}
          initialSystemMessage={initialMessage}
          placeholderText="Describe your homework problem..."
        />
      </div>
    </div>
  );
}
