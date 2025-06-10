
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
  storageTopic: string;
  initialSystemMessageTemplate: string;
  placeholderTextTemplate: string;
  enableImageUpload: boolean;
}

const visualModes: ModeConfig[] = [
  {
    id: "graphs", label: "Graphs & Charts", icon: BarChart3, description: "Visualize data, comparisons, and trends with AI-generated charts.",
    storageTopic: "Visual Learning - Graphs & Charts",
    initialSystemMessageTemplate: "Hello ${profileName}! Let's create some Graphs & Charts. Describe the data you want to visualize, what kind of chart you're thinking of (e.g., bar, line, pie), and what insights you're hoping to see. For example: 'Create a bar chart for country populations.'",
    placeholderTextTemplate: "E.g., Create a bar chart of global temperatures...",
    enableImageUpload: false,
  },
  {
    id: "diagrams", label: "Conceptual Diagrams", icon: LayoutGrid, description: "Illustrate complex systems and processes with clear, AI-generated diagrams.",
    storageTopic: "Visual Learning - Conceptual Diagrams",
    initialSystemMessageTemplate: "Hi ${profileName}! Ready to make some Conceptual Diagrams? Tell me the process or system you want to illustrate. Remember to specify that text labels should be clear and legible. For example: 'Diagram the process of photosynthesis clearly with legible labels.'",
    placeholderTextTemplate: "E.g., Diagram the water cycle with clear labels...",
    enableImageUpload: true,
  },
  {
    id: "mindmaps", label: "Mind Maps / Flowcharts", icon: BrainCircuit, description: "Organize ideas visually using an interactive canvas, guided by AI.",
    storageTopic: "Visual Learning - Mind Maps",
    initialSystemMessageTemplate: "Welcome ${profileName}! Let's use the interactive canvas. What's the central idea or topic for your mind map or flowchart? For example: 'My Project Plan.'",
    placeholderTextTemplate: "E.g., Type your central idea for the canvas...",
    enableImageUpload: true,
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
      setChatKey(newId);
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
    let initialMessage = modeConfig.initialSystemMessageTemplate.replace('${profileName}', profile.name);
    if (modeConfig.id === 'mindmaps' && searchParams.get('sessionId')) {
        const conversation = getConversationById(currentConversationId || "");
        const firstUserMessage = conversation?.messages.find(m => m.sender === 'user');
        if(firstUserMessage?.text) {
            initialMessage = initialMessage.replace("What's the central idea or topic?", `For your topic: "${firstUserMessage.text}"`);
        }
    }
    return initialMessage;
  }


  return (
    <div className="min-h-full flex flex-col pt-0 bg-gradient-to-br from-background via-muted/30 to-accent/10 dark:from-background dark:via-muted/10 dark:to-accent/5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <PieChartIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-accent"/> Visual Learning Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore concepts with AI-generated graphs, diagrams, and interactive mind maps.
            </p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="mt-3 sm:mt-0 shadow-sm">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session ({activeModeConfig.label})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {visualModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <Card
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1.5 flex flex-col",
                "bg-card border-2 rounded-xl overflow-hidden", // More opaque card, rounded-xl
                isActive
                  ? "border-primary shadow-xl shadow-primary/25 ring-2 ring-primary/50"
                  : "border-border hover:border-primary/60 hover:shadow-lg dark:bg-slate-800/80 dark:hover:border-primary/70"
              )}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(mode.id)}
              role="button"
              aria-pressed={isActive}
              aria-label={`Switch to ${mode.label} mode`}
            >
              <CardHeader className="items-center text-center p-5 sm:p-6">
                <div className={cn(
                    "p-3 rounded-full mb-3 transition-colors", // Larger icon padding, circular
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon className={cn("h-10 w-10 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                </div>
                <CardTitle className={cn("text-lg font-semibold transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>{mode.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-center flex-grow flex flex-col justify-center">
                   <CardDescription className="text-sm leading-relaxed text-muted-foreground">{mode.description}</CardDescription>
              </CardContent>
              {isActive && (
                <div className="w-full h-1.5 bg-primary rounded-b-lg mt-auto"></div>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {profile && currentConversationId && chatKey && activeModeConfig && (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={activeModeConfig.storageTopic}
            conversationId={currentConversationId}
            initialSystemMessage={getInitialMessageForMode(activeModeConfig)}
            placeholderText={activeModeConfig.placeholderTextTemplate}
            enableImageUpload={activeModeConfig.enableImageUpload}
            initialInputQuery={activeMode === 'mindmaps' && !searchParams.get('sessionId') ? "My central idea" : undefined}
          />
        )}
      </div>
       <div className="text-center mt-8 py-4">
            <Sparkles className="h-6 w-6 text-accent mx-auto mb-2 opacity-80"/>
            <p className="text-sm text-muted-foreground">Select a mode above to begin your visual exploration.</p>
        </div>
    </div>
  );
}
    