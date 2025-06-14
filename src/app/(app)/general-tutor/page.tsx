
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Sparkles, Edit, BookOpen, RotateCcw, HelpCircle, Brain as BrainIcon, FileQuestion, Camera, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from "react";
import { getConversationById } from "@/lib/chat-storage";
import type { UserProfile } from "@/types";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const subjectTags = ["Math", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "Economics"];

interface SuggestionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, description, icon: Icon, action }) => (
  <div 
    className="p-4 bg-card rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    onClick={action || (() => console.log(`${title} card clicked`))}
  >
    <Icon className="h-6 w-6 text-primary mb-2"/>
    <h4 className="font-semibold text-foreground mb-1">{title}</h4>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
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

  const initialMainChatMessage = `Hi ${profile.name}! I'm your AI Learning Assistant. Ask me any question about your studies, homework, or concepts you'd like to understand better. You can also upload an image for context. How can I help you today?`;

  return (
    <div className="min-h-full flex flex-col items-center pt-0 bg-gradient-to-br from-background via-muted/30 to-accent/10 dark:from-background dark:via-muted/10 dark:to-accent/5">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center my-6">
          <div className="flex items-center space-x-3">
            <BrainIcon className="h-7 w-7 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                AI Learning Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Your multi-modal personal tutor for general queries.
              </p>
            </div>
          </div>
          <Button onClick={handleNewSessionClick} variant="outline" size="sm" className="mt-4 sm:mt-0">
            <RotateCcw className="mr-2 h-4 w-4" /> New Conversation
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center my-6">
            <p className="text-2xl text-foreground flex items-center">
                <Sparkles className="mr-3 h-6 w-6 text-orange-500" />
                {profile.name ? `${profile.name} returns!` : "Welcome to EduAI Tutor!"}
            </p>
            <p className="text-lg text-muted-foreground mt-1">
                Ready to explore and learn something new?
            </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col items-center px-4 pb-4 min-h-0">
        <div className="w-full flex-grow min-h-0">
            {chatKey && currentConversationId && (
            <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic="AI Learning Assistant Chat"
                conversationId={currentConversationId}
                initialSystemMessage={initialMainChatMessage}
                placeholderText="Ask anything or upload an image..."
                enableImageUpload={true}
            />
            )}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SuggestionCard 
                title="Ask Anything"
                description="From complex math equations to historical event details."
                icon={FileQuestion}
            />
            <SuggestionCard 
                title="Snap & Solve"
                description="Upload images of handwritten problems or textbook questions."
                icon={Camera}
            />
            <SuggestionCard 
                title="Step-by-Step"
                description="Get detailed explanations and learn the method, not just the answer."
                icon={Calculator}
            />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {subjectTags.map(tag => (
            <span 
                key={tag} 
                className="text-xs text-muted-foreground px-3 py-1 bg-card rounded-full shadow-sm border cursor-pointer hover:bg-muted transition-colors"
                onClick={() => console.log(`${tag} tag clicked`)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

