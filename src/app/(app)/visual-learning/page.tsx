
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
import type { UserProfile } from "@/types";

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
    id: "graphs", label: "Graphs & Charts", icon: BarChart3, description: "Visualize data, comparisons, and trends.",
    storageTopic: "Visual Learning - Graphs & Charts",
    initialSystemMessageTemplate: "Hello ${profileName}! Let's create some Graphs & Charts. Describe the data, chart type (bar, line), and insights. E.g., 'Bar chart for country populations.'",
    placeholderTextTemplate: "E.g., Bar chart of global temperatures...",
    enableImageUpload: false,
  },
  {
    id: "diagrams", label: "Conceptual Diagrams", icon: LayoutGrid, description: "Illustrate complex systems and processes.",
    storageTopic: "Visual Learning - Conceptual Diagrams",
    initialSystemMessageTemplate: "Hi ${profileName}! For Conceptual Diagrams, tell me the process/system. Ensure text labels are clear. E.g., 'Diagram photosynthesis with legible labels.'",
    placeholderTextTemplate: "E.g., Diagram the water cycle with clear labels...",
    enableImageUpload: true,
  },
  {
    id: "mindmaps", label: "Mind Maps / Flowcharts", icon: BrainCircuit, description: "Organize ideas with an interactive canvas.",
    storageTopic: "Visual Learning - Mind Maps",
    initialSystemMessageTemplate: "Welcome ${profileName}! For the interactive canvas, what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.'",
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

  const getInitialMessageForMode = (modeConfig: ModeConfig, currentProfile: UserProfile) => {
    let initialMessage = modeConfig.initialSystemMessageTemplate.replace('${profileName}', currentProfile.name);
    if (modeConfig.id === 'mindmaps' && searchParams.get('sessionId') && currentConversationId) {
        const conversation = getConversationById(currentConversationId);
        const firstUserMessage = conversation?.messages.find(m => m.sender === 'user');
        if(firstUserMessage?.text) {
            initialMessage = initialMessage.replace("What's the central idea or topic?", `For your topic: "${firstUserMessage.text}"`);
        }
    }
    return initialMessage;
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {visualModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <Card
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 flex flex-col",
                "bg-card border-2 rounded-xl overflow-hidden", // Changed to rounded-xl
                isActive
                  ? "border-primary shadow-xl shadow-primary/25 ring-1 ring-primary/50" // Enhanced active shadow
                  : "border-border hover:border-primary/50 hover:shadow-lg dark:bg-slate-800/70 dark:hover:border-primary/70"
              )}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(mode.id)}
              role="button"
              aria-pressed={isActive}
              aria-label={`Switch to ${mode.label} mode`}
            >
              <CardHeader className="items-center text-center p-3 pb-1"> {/* Reduced padding further */}
                <div className={cn(
                    "p-2 rounded-full mb-1.5 transition-colors", // Further reduced padding and margin
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon className={cn("h-6 w-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} /> {/* Icon size h-6 w-6 */}
                </div>
                <CardTitle className={cn("text-sm font-semibold transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>{mode.label}</CardTitle> {/* Title size sm */}
              </CardHeader>
              <CardContent className="p-3 pt-1 text-center flex-grow flex flex-col justify-center"> {/* Reduced padding */}
                   <CardDescription className="text-xs leading-normal text-muted-foreground">{mode.description}</CardDescription> {/* leading-normal for better wrap */}
              </CardContent>
              {isActive && (
                <div className="w-full h-1 bg-primary mt-auto"></div>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="flex-grow min-h-0 w-full">
        {profile && currentConversationId && chatKey && activeModeConfig && (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={activeModeConfig.storageTopic}
            conversationId={currentConversationId}
            initialSystemMessage={getInitialMessageForMode(activeModeConfig, profile)}
            placeholderText={activeModeConfig.placeholderTextTemplate}
            enableImageUpload={activeModeConfig.enableImageUpload}
            initialInputQuery={activeMode === 'mindmaps' && !searchParams.get('sessionId') ? "My central idea" : undefined}
          />
        )}
      </div>
       <div className="text-center mt-4 py-2">
            <Sparkles className="h-4 w-4 text-accent mx-auto mb-1 opacity-70"/>
            <p className="text-xs text-muted-foreground">Select a mode above to begin your visual exploration.</p>
        </div>
    </div>
  );
}
    
