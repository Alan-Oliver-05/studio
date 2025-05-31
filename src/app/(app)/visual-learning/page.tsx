
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, BarChart3, BarChartHorizontalBig, LayoutGrid, BrainCircuit, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
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
  { id: "graphs", title: "Graphs & Charts", icon: BarChartHorizontalBig, description: "Visualize data, comparisons, and trends.", initialQueryTemplate: "Show me a bar chart for [concept] comparing [item A] and [item B]." },
  { id: "diagrams", title: "Conceptual Diagrams", icon: LayoutGrid, description: "Understand complex systems and processes.", initialQueryTemplate: "Can you create a diagram to explain [process or system]?" },
  { id: "mindmaps", title: "Mind Maps", icon: BrainCircuit, description: "Organize and connect ideas visually.", initialQueryTemplate: "Generate a mind map for the topic of [topic]." },
];

const suggestionChips = [
  "Explain the water cycle with a diagram",
  "Create a bar chart of country populations",
  "Diagram the process of photosynthesis clearly",
  "Generate a mind map about the solar system with legible labels",
  "Show me an image of a DNA double helix",
  "Illustrate the concept of supply and demand using a graph",
  "Create a flowchart for a basic algorithm",
  "Generate an image of the human heart with labels",
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
      const defaultId = `visual-main-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId);
    }
  }, [searchParams, profile]);

  const handleFeatureCardClick = (queryTemplate: string) => {
    setInitialChipQuery(queryTemplate);
    // Scroll to chat input could be added here if needed
    const chatInput = document.querySelector('input[aria-label="Chat input"]') as HTMLInputElement | null;
    chatInput?.focus();
  };

  const handleSuggestionChipClick = (suggestion: string) => {
    setInitialChipQuery(suggestion);
    const chatInput = document.querySelector('input[aria-label="Chat input"]') as HTMLInputElement | null;
    chatInput?.focus();
  };

  const handleNewSession = () => {
    router.push('/visual-learning', { scroll: false }); 
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `visual-main-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
      setInitialChipQuery(""); 
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
  
  const initialChatMessage = `Hi ${profile.name}! Welcome to Visual Learning. How can I help you visualize a concept today? Ask me to generate an image, diagram, chart, or mind map. For diagrams or mind maps requiring text, please specify that labels should be clear and legible. Example: "Generate a mind map of the water cycle. Render all text labels clearly and legibly. Labels should be bold and easy to read."`;

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 md:px-0 pt-0 mt-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <PieChartIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Visual Learning Studio
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Explore concepts with AI-generated interactive graphs, charts, diagrams, and images.
          </p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Visual Session
        </Button>
      </div>
      <div className="px-4 max-w-4xl mx-auto w-full mb-6">
        <Card className="p-4 bg-muted/30 border-dashed border-primary/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {featureCards.map((card) => (
              <Card
                key={card.id}
                className="flex flex-col items-center justify-center p-3 text-center border rounded-lg shadow-sm hover:shadow-md hover:border-primary/70 transition-all cursor-pointer bg-card text-card-foreground h-full"
                onClick={() => handleFeatureCardClick(card.initialQueryTemplate)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFeatureCardClick(card.initialQueryTemplate)}
                role="button"
                aria-label={`Start with ${card.title}`}
              >
                <card.icon className="h-7 w-7 text-primary mb-1.5" />
                <h3 className="text-xs sm:text-sm font-semibold">{card.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{card.description}</p>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-1.5 text-center sm:text-left">Quick start suggestions:</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
            {suggestionChips.slice(0,4).map((suggestion, index) => ( // Show fewer chips initially
              (<Button
                key={index}
                variant="outline"
                size="sm"
                className="rounded-full text-xs h-auto py-1 px-2.5 bg-background hover:bg-accent/10"
                onClick={() => handleSuggestionChipClick(suggestion)}
              >
                <Sparkles className="h-3 w-3 mr-1.5 text-accent opacity-70"/> {suggestion}
              </Button>)
            ))}
          </div>
        </Card>
      </div>
      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto pb-4 px-0 sm:px-4">
        {chatKey && currentConversationId && (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic="Visual Learning Focus" // Use "Visual Learning Focus" to enable visualElement output.
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessage}
            placeholderText="Describe what you want to visualize, e.g., 'Generate an image of a plant cell with labels'"
            initialInputQuery={initialChipQuery}
            onInitialQueryConsumed={() => setInitialChipQuery("")}
          />
        )}
      </div>
    </div>
  );
}
