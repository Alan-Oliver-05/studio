
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, BarChart3, BarChartHorizontalBig, LayoutGrid, BrainCircuit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

interface FeatureCardData {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  initialQueryTemplate: string;
}

const featureCards: FeatureCardData[] = [
  { id: "graphs", title: "Graphs & Charts", icon: BarChartHorizontalBig, description: "Visualize data and trends.", initialQueryTemplate: "Show me a graph or chart for [concept]..." },
  { id: "diagrams", title: "Diagram Solutions", icon: LayoutGrid, description: "Understand complex systems.", initialQueryTemplate: "Can you create a diagram to explain [concept]?" },
  { id: "mindmaps", title: "Mind Maps", icon: BrainCircuit, description: "Organize and connect ideas.", initialQueryTemplate: "Generate a mind map for [topic]." },
];

const suggestionChips = [
  "Explain the water cycle visually",
  "Create a bar chart of population growth",
  "Diagram the process of photosynthesis",
  "Generate a mind map about the solar system",
  "Show me an image of a DNA helix",
  "Illustrate the concept of supply and demand",
];

export default function VisualLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
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

  const handleFeatureCardClick = (queryTemplate: string) => {
    setInitialChipQuery(queryTemplate);
  };

  const handleSuggestionChipClick = (suggestion: string) => {
    setInitialChipQuery(suggestion);
  };

  const handleNewSession = () => {
    router.push('/visual-learning', { scroll: false }); // Clear sessionId from URL
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `visual-learning-main-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
      setInitialChipQuery(""); // Clear any pending initial query
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
  
  const initialChatMessage = `Hi ${profile.name}! Welcome to Visual Learning. How can I help you visualize a concept today? Ask me to generate an image, diagram, chart, or mind map. For diagrams or mind maps with text, please request clear and legible labels.`;

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-4 md:px-0 pt-0 mt-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <PieChartIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Visual Learning Tools
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Explore concepts with AI-generated interactive graphs, charts, and diagrams.
          </p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Visual Session
        </Button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 px-4 max-w-4xl mx-auto w-full">
        {featureCards.map((card) => (
          <Card
            key={card.id}
            className="flex flex-col items-center justify-center p-4 sm:p-6 border rounded-lg shadow-sm hover:shadow-lg hover:border-primary transition-all cursor-pointer bg-card text-card-foreground"
            onClick={() => handleFeatureCardClick(card.initialQueryTemplate)}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFeatureCardClick(card.initialQueryTemplate)}
            role="button"
            aria-label={`Start with ${card.title}`}
          >
            <card.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 sm:mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-center">{card.title}</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">{card.description}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 px-4 max-w-4xl mx-auto w-full">
        <p className="text-sm text-muted-foreground mb-2 text-center">Or, try one of these suggestions:</p>
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
            topic="Visual Learning" 
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessage}
            placeholderText="Describe what you want to visualize..."
            initialInputQuery={initialChipQuery}
            onInitialQueryConsumed={() => setInitialChipQuery("")}
          />
        )}
      </div>
    </div>
  );
}
