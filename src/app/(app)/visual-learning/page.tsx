
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, RotateCcw } from "lucide-react"; // Added RotateCcw
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import { useEffect, useState } from "react";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

export default function VisualLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter(); // Added router
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
    } else if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now(); // Used for new sessions
      const defaultId = `visual-learning-main-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId);
    }
  }, [searchParams, profile]);

  const handleNewSession = () => {
    router.push('/visual-learning', { scroll: false }); // Navigate to base path
    if (profile) {
        const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
        const newTimestamp = Date.now();
        const newId = `visual-learning-main-${profileIdentifier}-${newTimestamp}`;
        setCurrentConversationId(newId);
        setChatKey(newId);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Visual Learning Tools...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use Visual Learning Tools, we need your profile information. Please complete the onboarding process first.
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
        <p className="mt-4 text-muted-foreground">Initializing visual learning session...</p>
      </div>
    );
  }

  const initialChatMessage = `Hi ${profile.name}! Welcome to Visual Learning. How can I help you visualize a concept today? Ask me to **generate an image** (e.g., 'generate an image of a plant cell with labels for all organelles, ensure text labels are clear, prominent, and concise'), explain something with a chart, or describe a flowchart. For example: 'Show a bar chart of planet sizes.' or 'Create a diagram of the water cycle with clear text labels.'`;


  return (
    <div className="h-full flex flex-col mt-0 pt-0">
      <div className="flex justify-between items-center mb-6 pt-0 mt-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
                <PieChartIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Visual Learning Tools
            </h1>
            <p className="text-muted-foreground mt-1">Explore concepts with AI-generated interactive visuals.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> New Visual Session
        </Button>
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {chatKey && currentConversationId && (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="Visual Learning"
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessage}
            placeholderText="Ask for a visual explanation..."
          />
        )}
      </div>
    </div>
  );
}
