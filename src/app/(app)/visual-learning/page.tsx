
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, BarChart3, BarChartHorizontalBig, LayoutGrid, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Message as MessageType } from "@/types"; // Import MessageType

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const featureCards = [
  { id: "graphs", title: "Graphs & Charts", icon: BarChartHorizontalBig, description: "Visualize data and trends." },
  { id: "diagrams", title: "Diagram Solutions", icon: LayoutGrid, description: "Understand complex systems." },
  { id: "mindmaps", title: "Mind Maps", icon: BrainCircuit, description: "Organize and connect ideas." },
];

const suggestionChips = [
  "Explain this concept in simple terms",
  "Can you give me practice problems?",
  "I need help with my homework",
  "Quiz me on this topic",
  "Show me a step-by-step solution",
  "What are common mistakes to avoid?",
  "Translate this to Spanish",
  "Help me with pronunciation",
];

export default function VisualLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [initialChipQuery, setInitialChipQuery] = useState<string>("");


  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
    } else if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const defaultId = `visual-learning-main-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId);
    }
  }, [searchParams, profile]);

  const handleFeatureCardClick = (featureId: string) => {
    setSelectedFeature(featureId);
    // For now, just log or set state. Could prime the chat later.
    console.log("Selected feature:", featureId);
    // Example: If you want to send a message when a card is clicked:
    // setInitialChipQuery(`Tell me more about ${featureCards.find(f=>f.id === featureId)?.title}`);
  };

  const handleSuggestionChipClick = (suggestion: string) => {
    setInitialChipQuery(suggestion);
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

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="text-center pt-8 pb-6">
        <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
          Visual Learning Tools
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Get interactive visual explanations with graphs, charts, and diagrams to help understand complex concepts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 px-4 max-w-3xl mx-auto w-full">
        {featureCards.map((card) => (
          <Card
            key={card.id}
            className="flex flex-col items-center justify-center p-4 sm:p-6 border rounded-lg shadow-sm hover:shadow-lg hover:border-primary transition-all cursor-pointer bg-card text-card-foreground"
            onClick={() => handleFeatureCardClick(card.id)}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFeatureCardClick(card.id)}
            role="button"
          >
            <card.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 sm:mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-center">{card.title}</h3>
            {/* <p className="text-xs text-muted-foreground text-center mt-1">{card.description}</p> */}
          </Card>
        ))}
      </div>

      <div className="mb-6 px-4 max-w-3xl mx-auto w-full">
        <div className="flex flex-wrap justify-center gap-2">
          {suggestionChips.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-auto py-1.5 px-3"
              onClick={() => handleSuggestionChipClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto pb-4 px-0 sm:px-4">
        {chatKey && currentConversationId && (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="Visual Learning" // Or make this dynamic based on selectedFeature
            conversationId={currentConversationId}
            // initialSystemMessage removed
            placeholderText="Type your message or ask for a visual..."
            initialInputQuery={initialChipQuery}
            onInitialQueryConsumed={() => setInitialChipQuery("")}
          />
        )}
      </div>
    </div>
  );
}
