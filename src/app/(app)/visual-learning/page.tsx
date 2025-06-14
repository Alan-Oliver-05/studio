
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, PieChartIcon, BarChart3, LayoutGrid, BrainCircuit, RotateCcw, Sparkles, PanelLeftOpen, PanelRightOpen, Columns2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from "react"; 
import { cn } from "@/lib/utils";
import { getConversationById } from "@/lib/chat-storage";
import type { UserProfile, InitialNodeData } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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

const AIGraphsAndCharts = dynamic(
  () => import('./components/AIGraphsAndCharts').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-4 h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Charts...</div>
  }
);

const AIConceptualDiagrams = dynamic(
  () => import('./components/AIConceptualDiagrams').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-4 h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Diagrams...</div>
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

  const [activeMode, setActiveMode] = useState<VisualLearningMode>(visualModes[0].id); 
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());
  const [mindMapConfig, setMindMapConfig] = useState<{ initialTopic?: string; initialNodes?: InitialNodeData[] } | null>(null);
  const [canvasPanelGrow, setCanvasPanelGrow] = useState(7);

  const getStorageTopicForMode = useCallback((mode: VisualLearningMode): string => {
    return visualModes.find(m => m.id === mode)?.storageTopic || "Visual Learning - General";
  }, []);

  const initializeNewSession = useCallback((mode: VisualLearningMode) => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const modeTopic = getStorageTopicForMode(mode);
      const newId = `${modeTopic.replace(/\s+/g, '-').toLowerCase()}-${profileIdentifier}-${newTimestamp}`;

      setCurrentConversationId(newId);
      setChatKey(newId);

      if (mode === "mindmaps") {
        setMindMapConfig({ initialTopic: "My New Mind Map", initialNodes: [] });
        setCanvasPanelGrow(window.innerWidth < 768 ? 10 : 7); // Maximize canvas on mobile by default for mindmaps
      } else {
        setMindMapConfig(null);
      }
      if (searchParams.get('mode') !== mode || !searchParams.get('sessionId')) {
        router.push(`/visual-learning?mode=${mode}`, { scroll: false });
      }
    }
  }, [profile, getStorageTopicForMode, router, searchParams]);


  useEffect(() => {
    if (!profile || profileLoading) return;

    const modeFromQuery = searchParams.get('mode') as VisualLearningMode | null;
    const sessionIdFromQuery = searchParams.get('sessionId');
    let targetMode = modeFromQuery || activeMode;

    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation) {
        const foundModeConfig = visualModes.find(m => m.storageTopic === conversation.topic);
        const conversationMode = foundModeConfig ? foundModeConfig.id : targetMode;

        setActiveMode(conversationMode);
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);

        if (conversationMode === 'mindmaps') {
          const lastMindMapMsg = [...conversation.messages].reverse().find(
            msg => msg.sender === 'ai' && msg.visualElement?.type === 'interactive_mind_map_canvas'
          );
          if (lastMindMapMsg && lastMindMapMsg.visualElement) {
            setMindMapConfig({
              initialTopic: lastMindMapMsg.visualElement.content?.initialTopic,
              initialNodes: lastMindMapMsg.visualElement.content?.initialNodes,
            });
          } else {
            const firstUserMessageText = conversation.messages.find(m => m.sender === 'user')?.text;
            setMindMapConfig({ initialTopic: firstUserMessageText || "Restored Mind Map", initialNodes: [] });
          }
           setCanvasPanelGrow(window.innerWidth < 768 ? 10 : 7); // Ensure mobile default for mindmaps
        } else {
          setMindMapConfig(null);
        }
        if (modeFromQuery !== conversationMode) {
            router.replace(`/visual-learning?sessionId=${sessionIdFromQuery}&mode=${conversationMode}`, { scroll: false });
        }
        return;
      } else {
        setActiveMode(targetMode); 
        initializeNewSession(targetMode); 
        return;
      }
    }
    
    if (activeMode !== targetMode) {
        setActiveMode(targetMode);
    }
    if (!currentConversationId || (modeFromQuery && activeModeConfig && activeModeConfig.id !== modeFromQuery)) {
        initializeNewSession(targetMode);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile, profileLoading, router, initializeNewSession]); 
  
  const activeModeConfig = visualModes.find(m => m.id === activeMode) || visualModes[0];


  const handleModeChange = useCallback((newMode: VisualLearningMode) => {
    setActiveMode(newMode); 
    initializeNewSession(newMode); 
  }, [initializeNewSession]);


  const handleNewSessionClick = useCallback(() => {
    initializeNewSession(activeMode);
  }, [activeMode, initializeNewSession]);

  const handleMindMapConfigChange = useCallback((config: { initialTopic?: string; initialNodes?: InitialNodeData[] } | null) => {
    setMindMapConfig(config);
  }, []);

  const handlePanelResize = (action: 'wider-canvas' | 'wider-chat' | 'reset' | 'maximize-canvas' | 'maximize-chat') => {
    const isCurrentlyMobile = window.innerWidth < 768;
    switch (action) {
      case 'wider-canvas':
        setCanvasPanelGrow(prev => Math.min(isCurrentlyMobile ? 10 : 9, prev + (isCurrentlyMobile ? 2 : 1)));
        break;
      case 'wider-chat':
        setCanvasPanelGrow(prev => Math.max(isCurrentlyMobile ? 0 : 1, prev - (isCurrentlyMobile ? 2 : 1)));
        break;
      case 'reset':
        setCanvasPanelGrow(isCurrentlyMobile ? 5 : 7); // 50/50 on mobile, 70/30 on desktop
        break;
      case 'maximize-canvas':
        setCanvasPanelGrow(10); 
        break;
      case 'maximize-chat':
        setCanvasPanelGrow(0); 
        break;
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

   if (!currentConversationId || !chatKey || !activeModeConfig) {
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
        if(firstUserMessage?.text && (firstUserMessage.text.length < 100)) {
             initialMessage = initialMessage.replace("what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.'", `the canvas is ready for your topic: "${firstUserMessage.text}". You can add nodes or upload a document.`);
        } else if (mindMapConfig?.initialTopic) {
             initialMessage = initialMessage.replace("what's your central idea for the mind map/flowchart? E.g., 'My Project Plan.'", `the canvas is ready for your topic: "${mindMapConfig.initialTopic}".`);
        }
    }
    return initialMessage;
  };
  
  const canvasPanelStyle = { flexGrow: canvasPanelGrow, flexBasis: '0%', minWidth: canvasPanelGrow === 0 ? '0px' : 'auto', display: canvasPanelGrow === 0 ? 'none' : 'flex' };
  const chatPanelStyle = { flexGrow: 10 - canvasPanelGrow, flexBasis: '0%', minWidth: canvasPanelGrow === 10 ? '0px' : 'auto', display: canvasPanelGrow === 10 ? 'none' : 'flex' };


  return (
    <div className="h-full flex flex-col pt-0 bg-gradient-to-br from-background via-muted/30 to-accent/10 dark:from-background dark:via-muted/10 dark:to-accent/5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <PieChartIcon className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent"/> Visual Learning Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Explore concepts with AI-generated graphs, diagrams, and interactive mind maps.
            </p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="shadow-sm text-xs sm:text-sm">
          <RotateCcw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Session ({activeModeConfig.label})
        </Button>
      </div>

      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex flex-wrap justify-center gap-1">
          {visualModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <Button
                key={mode.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => handleModeChange(mode.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 sm:py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1 sm:gap-1.5",
                  isActive && "shadow-md bg-background text-primary font-semibold"
                )}
                aria-pressed={isActive}
              >
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {mode.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 w-full">
        {profile && currentConversationId && chatKey && activeModeConfig && (
          <>
            {activeMode === "graphs" ? (
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    <AIGraphsAndCharts />
                </div>
            ) : activeMode === "diagrams" ? (
                <div className="flex-1 flex flex-col min-h-0 w-full max-w-5xl mx-auto">
                    <AIConceptualDiagrams
                        userProfile={profile}
                        conversationId={currentConversationId}
                    />
                </div>
            ) : activeMode === "mindmaps" ? (
             <TooltipProvider>
              <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 overflow-hidden relative h-full">
                {(canvasPanelGrow > 0 || (10-canvasPanelGrow) > 0) && (
                    <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-20 flex gap-0.5 md:gap-1 bg-background/70 dark:bg-slate-800/70 p-0.5 md:p-1 rounded-md shadow-md border border-border dark:border-slate-700">
                    <Tooltip><TooltipTrigger asChild><Button size="xs" variant="ghost" onClick={() => handlePanelResize('maximize-canvas')} className="h-6 w-6 md:h-7 md:w-7 p-1"><Maximize2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Maximize Canvas</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="xs" variant="ghost" onClick={() => handlePanelResize('wider-canvas')} className="h-6 w-6 md:h-7 md:w-7 p-1"><PanelRightOpen className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Wider Canvas</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="xs" variant="ghost" onClick={() => handlePanelResize('reset')} className="h-6 w-6 md:h-7 md:w-7 p-1"><Columns2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Reset Layout</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="xs" variant="ghost" onClick={() => handlePanelResize('wider-chat')} className="h-6 w-6 md:h-7 md:w-7 p-1"><PanelLeftOpen className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Wider Chat</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="xs" variant="ghost" onClick={() => handlePanelResize('maximize-chat')} className="h-6 w-6 md:h-7 md:w-7 p-1"><Minimize2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Maximize Chat</p></TooltipContent></Tooltip>
                    </div>
                )}

                <div className="flex flex-col overflow-hidden border rounded-lg shadow-md bg-card dark:bg-slate-800 h-full" style={canvasPanelStyle}>
                  <AIMindMapDisplay
                    key={chatKey} 
                    initialTopic={mindMapConfig?.initialTopic}
                    initialNodes={mindMapConfig?.initialNodes}
                  />
                </div>
                <div className="flex flex-col overflow-hidden h-full" style={chatPanelStyle}>
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
             </TooltipProvider>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
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
       <div className="text-center mt-4 py-1 sm:py-2">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent mx-auto mb-1 opacity-70"/>
            <p className="text-xs text-muted-foreground">Select a mode above to begin your visual exploration.</p>
        </div>
    </div>
  );
}
