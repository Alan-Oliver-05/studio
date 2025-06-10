"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, BarChart3, LayoutGrid, BrainCircuit, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getConversationById } from "@/lib/chat-storage";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

type VisualLearningMode = "graphs" | "diagrams" | "mindmaps";

interface ModeConfig {
  id: VisualLearningMode;
  label: string;
  icon: React.ElementType;
  description: string;
  storageTopic: string; // This will be the 'specificTopic' for the AI flow
  initialSystemMessageTemplate: string;
  placeholderTextTemplate: string;
  enableImageUpload: boolean;
}

const visualModes: ModeConfig[] = [
  {
    id: "graphs", label: "Graphs & Charts", icon: BarChart3, description: "Visualize data, comparisons, and trends.",
    storageTopic: "Visual Learning - Graphs & Charts",
    initialSystemMessageTemplate: "Hello ${profileName}! Let's create some Graphs & Charts. Describe the data you want to visualize, what kind of chart you're thinking of (e.g., bar, line, pie), and what insights you're hoping to see. For example: 'Create a bar chart for country populations.'",
    placeholderTextTemplate: "E.g., Create a bar chart of global temperatures...",
    enableImageUpload: false,
  },
  {
    id: "diagrams", label: "Conceptual Diagrams", icon: LayoutGrid, description: "Understand complex systems and processes.",
    storageTopic: "Visual Learning - Conceptual Diagrams",
    initialSystemMessageTemplate: "Hi ${profileName}! Ready to make some Conceptual Diagrams? Tell me the process or system you want to illustrate. Remember to specify that text labels should be clear and legible. For example: 'Diagram the process of photosynthesis clearly with legible labels.'",
    placeholderTextTemplate: "E.g., Diagram the water cycle with clear labels...",
    enableImageUpload: true, // User might upload an image to base a diagram on
  },
  {
    id: "mindmaps", label: "Mind Maps", icon: BrainCircuit, description: "Organize ideas with textual mind maps.",
    storageTopic: "Visual Learning - Mind Maps",
    initialSystemMessageTemplate: "Welcome ${profileName}! Let's build a Mind Map. What's the central idea or topic? I'll create a structured textual outline for you. For example: 'Generate a mind map about the solar system.'",
    placeholderTextTemplate: "E.g., Create a mind map of renewable energy sources...",
    enableImageUpload: false, // Mind maps are textual outputs
  },
];


export default function VisualLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<VisualLearningMode>("graphs");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());

  const getStorageTopicForMode = (mode: VisualLearningMode): string => {
    return visualModes.find(m => m.id === mode)?.storageTopic || "Visual Learning - General";
  };

  const initializeNewSession = (mode: VisualLearningMode) => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const modeTopic = getStorageTopicForMode(mode);
      const newId = `${modeTopic.replace(/\s+/g, '-').toLowerCase()}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId); // Use the new ID as key to force re-mount of ChatInterface
      router.push(`/visual-learning?mode=${mode}`, { scroll: false });
    }
  };

  useEffect(() => {
    const modeFromQuery = searchParams.get('mode') as VisualLearningMode | null;
    const sessionIdFromQuery = searchParams.get('sessionId');
    let targetMode = modeFromQuery || activeMode;

    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation) {
        const foundModeConfig = visualModes.find(m => m.storageTopic === conversation.topic);
        if (foundModeConfig) {
            targetMode = foundModeConfig.id;
        }
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
        if (targetMode !== (searchParams.get('mode') || visualModes[0].id)) {
            router.replace(`/visual-learning?sessionId=${sessionIdFromQuery}&mode=${targetMode}`, { scroll: false });
        }
      } else {
        initializeNewSession(targetMode);
      }
    } else {
      initializeNewSession(targetMode);
    }
    if (activeMode !== targetMode) {
        setActiveMode(targetMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile]);


  const handleModeChange = (newMode: VisualLearningMode) => {
    if (newMode !== activeMode || !searchParams.get('sessionId')) {
      initializeNewSession(newMode);
    } else {
      router.push(`/visual-learning?mode=${newMode}`, { scroll: false });
      setActiveMode(newMode);
    }
  };

  const handleNewSessionClick = () => {
    initializeNewSession(activeMode);
  };

  const activeModeConfig = visualModes.find(m => m.id === activeMode) || visualModes[0];

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
  
  const getInitialMessageForMode = (modeConfig: ModeConfig) => {
    return modeConfig.initialSystemMessageTemplate.replace('${profileName}', profile.name);
  }

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <PieChartIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Visual Learning Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore concepts with AI-generated graphs, diagrams, and textual mind maps.
            </p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session ({activeModeConfig.label})
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {visualModes.map((mode) => (
          <Card
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-shadow border-2 flex flex-col",
              activeMode === mode.id ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "border-border bg-card"
            )}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(mode.id)}
            role="button"
            aria-pressed={activeMode === mode.id}
            aria-label={`Switch to ${mode.label} mode`}
          >
            <CardHeader className="flex flex-col items-center justify-center p-3 sm:p-4 text-center">
              <mode.icon className={cn("h-6 w-6 sm:h-7 sm:h-7 mb-1.5", activeMode === mode.id ? "text-primary" : "text-muted-foreground")} />
              <CardTitle className="text-xs sm:text-sm font-semibold">{mode.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-center flex-grow">
                 <CardDescription className="text-xs">{mode.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {profile && currentConversationId && chatKey && activeModeConfig && (
          <DynamicChatInterface
            key={chatKey} // This key is crucial for re-rendering ChatInterface on mode change
            userProfile={profile}
            topic={activeModeConfig.storageTopic} // This will be "Visual Learning - Graphs & Charts", etc.
            conversationId={currentConversationId}
            initialSystemMessage={getInitialMessageForMode(activeModeConfig)}
            placeholderText={activeModeConfig.placeholderTextTemplate}
            enableImageUpload={activeModeConfig.enableImageUpload}
          />
        )}
      </div>
    </div>
  );
}
