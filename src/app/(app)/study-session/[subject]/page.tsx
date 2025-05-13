
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { ChatInterface } from "../components/chat-interface";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudySessionPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const params = useParams();
  const router = useRouter();
  const subject = typeof params.subject === 'string' ? decodeURIComponent(params.subject) : "Selected Topic";

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
          To start a study session, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  const conversationId = `study-session-${profile.id || 'default'}-${subject.replace(/\s+/g, '_').toLowerCase()}`;
  const initialMessage = `Hello ${profile.name}! Let's start our study session on "${subject}". What would you like to focus on first?`;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Study Session: {subject}</h1>
        <p className="text-muted-foreground">Chat with your AI tutor to learn more about {subject}.</p>
      </div>
      <div className="flex-grow">
        <ChatInterface
          userProfile={profile}
          topic={subject}
          conversationId={conversationId}
          initialSystemMessage={initialMessage}
          placeholderText={`Ask about ${subject}...`}
        />
      </div>
    </div>
  );
}
