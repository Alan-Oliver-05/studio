
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
import type { UserProfile, InitialNodeData } from "@/types"; // Added InitialNodeData

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const AIMindMapDisplay = dynamic(
  () => import('./components/AIMindMapDisplay').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-4 h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Interactive Canvas...</div>
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
    initialSystemMessageTemplate: "Welcome ${profileName}! For the interactive canvas, what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.' You can also upload a document to auto-generate initial nodes.",
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
  const [mindMapConfig, setMindMapConfig] = useState<{ initialTopic?: string; initialNodes?: InitialNodeData[] } | null>(null);

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
      if (mode !== "mindmaps") {
        setMindMapConfig(null); // Reset mind map config if not in mindmap mode
      } else if (!searchParams.get('sessionId')) { // Only reset if it's truly a new mindmap session
        setMindMapConfig(null);
      }
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
        
        // If it's a mindmap session being restored, find the latest mindmap config from messages
        if (targetMode === 'mindmaps') {
          const lastMindMapMsg = [...conversation.messages].reverse().find(
            msg => msg.sender === 'ai' && msg.visualElement?.type === 'interactive_mind_map_canvas'
          );
          if (lastMindMapMsg && lastMindMapMsg.visualElement) {
            setMindMapConfig({
              initialTopic: lastMindMapMsg.visualElement.content?.initialTopic,
              initialNodes: lastMindMapMsg.visualElement.content?.initialNodes,
            });
          } else {
            // If no mindmap visual element found in history, but it's a mindmap session,
            // maybe initialize with the first user query as topic if available.
            const firstUserMessage = conversation.messages.find(m => m.sender === 'user');
            setMindMapConfig({ initialTopic: firstUserMessage?.text || "My Restored Ideas" });
          }
        }

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
    if (newMode !== "mindmaps") {
        setMindMapConfig(null);
    }
  };

  const handleNewSessionClick = () => {
    initializeNewSession(activeMode);
  };

  const handleMindMapConfigChange = (config: { initialTopic?: string; initialNodes?: InitialNodeData[] } | null) => {
    setMindMapConfig(config);
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
     if (modeConfig.id === 'mindmaps' && currentConversationId && searchParams.get('sessionId')) {
        const conversation = getConversationById(currentConversationId);
        const firstUserMessage = conversation?.messages.find(m => m.sender === 'user');
        if(firstUserMessage?.text && (firstUserMessage.text.length < 100)) { // Check length to avoid very long topics in sys message
             initialMessage = initialMessage.replace("what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.'", `the canvas is ready for your topic: "${firstUserMessage.text}". You can add nodes or upload a document.`);
        } else if (mindMapConfig?.initialTopic) {
             initialMessage = initialMessage.replace("what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.'", `the canvas is ready for your topic: "${mindMapConfig.initialTopic}".`);
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

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {visualModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <Card
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 flex flex-col",
                "bg-card border-2 rounded-xl overflow-hidden w-full sm:w-56 md:w-60 lg:w-64 flex-shrink-0", 
                isActive
                  ? "border-primary shadow-xl shadow-primary/25 ring-1 ring-primary/50" 
                  : "border-border hover:border-primary/50 hover:shadow-lg dark:bg-slate-800/70 dark:hover:border-primary/70"
              )}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(mode.id)}
              role="button"
              aria-pressed={isActive}
              aria-label={`Switch to ${mode.label} mode`}
            >
              <CardHeader className="items-center text-center p-2 pb-0.5"> 
                <div className={cn(
                    "p-1.5 rounded-full mb-1 transition-colors", 
                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} /> 
                </div>
                <CardTitle className={cn("text-xs font-medium transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>{mode.label}</CardTitle> 
              </CardHeader>
              <CardContent className="p-2 pt-0.5 text-center flex-grow flex flex-col justify-center"> 
                   <CardDescription className="text-xs leading-snug text-muted-foreground">{mode.description}</CardDescription> 
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
          <>
            {activeMode === "mindmaps" ? (
              <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden"> {/* Main container for the two columns */}
                {/* Left Column: Mind Map */}
                <div className="md:w-2/3 flex flex-col overflow-hidden border rounded-lg shadow-md bg-card"> 
                  <AIMindMapDisplay
                    key={chatKey} 
                    initialTopic={mindMapConfig?.initialTopic}
                    initialNodes={mindMapConfig?.initialNodes}
                  />
                </div>
                {/* Right Column: Chat */}
                <div className="md:w-1/3 flex flex-col overflow-hidden"> 
                  <DynamicChatInterface
                    key={`${chatKey}-chat`}
                    userProfile={profile}
                    topic={activeModeConfig.storageTopic}
                    conversationId={currentConversationId}
                    initialSystemMessage={getInitialMessageForMode(activeModeConfig, profile)}
                    placeholderText={activeModeConfig.placeholderTextTemplate}
                    enableImageUpload={activeModeConfig.enableImageUpload}
                    onMindMapConfigChange={handleMindMapConfigChange}
                  />
                </div>
              </div>
            ) : (
              // For other modes, display chat interface full width
              <div className="max-w-4xl mx-auto h-full">
                <DynamicChatInterface
                  key={chatKey}
                  userProfile={profile}
                  topic={activeModeConfig.storageTopic}
                  conversationId={currentConversationId}
                  initialSystemMessage={getInitialMessageForMode(activeModeConfig, profile)}
                  placeholderText={activeModeConfig.placeholderTextTemplate}
                  enableImageUpload={activeModeConfig.enableImageUpload}
                />
              </div>
            )}
          </>
        )}
      </div>
       <div className="text-center mt-4 py-2">
            <Sparkles className="h-4 w-4 text-accent mx-auto mb-1 opacity-70"/>
            <p className="text-xs text-muted-foreground">Select a mode above to begin your visual exploration.</p>
        </div>
    </div>
  );
}
    

