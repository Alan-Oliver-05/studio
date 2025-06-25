
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type as TypeIcon, Mic, MessagesSquare, Camera as CameraIcon, FileText as FileTextIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getConversationById } from "@/lib/chat-storage";
import type { UserProfile, InitialNodeData, LanguageLearningMode, ConversationSetupParams } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LANGUAGES } from "@/lib/constants";


const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const VoiceTranslatorInterface = dynamic(() =>
  import('./components/voice-translator-interface').then((mod) => mod.default),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const DocumentTranslatorInterface = dynamic(() =>
  import('./components/DocumentTranslatorInterface').then((mod) => mod.default),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const ImageTextTranslatorInterface = dynamic(() =>
  import('./components/ImageTextTranslatorInterface').then((mod) => mod.default),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const ConversationPracticeSetup = dynamic(() =>
  import('./components/ConversationPracticeSetup').then((mod) => mod.default),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);


interface ModeConfig {
  id: LanguageLearningMode;
  label: string;
  icon: React.ElementType;
  description: string; 
  storageTopic: string; 
  initialSystemMessageTemplate?: string; // Made optional for conversation mode
  placeholderTextTemplate: string;
  enableImageUpload: boolean;
}

const languageLearningModes: ModeConfig[] = [
  {
    id: "voice", label: "Voice", icon: Mic, 
    description: "Speak and get instant voice translations. Supports multiple languages.", 
    storageTopic: "Language Voice Translation", 
    initialSystemMessageTemplate: "Hi ${profileName}! Use the mic to speak. I'll translate your words.", 
    placeholderTextTemplate: "Click mic and start speaking...", 
    enableImageUpload: false
  },
  {
    id: "conversation", label: "Conversation", icon: MessagesSquare, 
    description: "Practice bilingual dialogues with an AI partner in various scenarios.", 
    storageTopic: "Language Conversation Practice",
    // initialSystemMessageTemplate is now generated dynamically based on setup
    placeholderTextTemplate: "Your turn to speak...", // Will be updated
    enableImageUpload: false
  },
  {
    id: "camera", label: "Image Text", icon: CameraIcon, 
    description: "Translate text from images captured or uploaded from your device.", 
    storageTopic: "Language Camera Translation",
    initialSystemMessageTemplate: "Hello ${profileName}! Upload an image with text, and I'll translate it. Please also specify the target language if it's not your preferred one.",
    placeholderTextTemplate: "Upload an image and type target language if needed...",
    enableImageUpload: true 
  },
  {
    id: "document", label: "Document/Text", icon: FileTextIcon, 
    description: "Translate text content from uploaded documents or pasted text.", 
    storageTopic: "Language Document Translation",
    initialSystemMessageTemplate: "Hello ${profileName}! Upload your document (or paste its text content), specify languages, and I'll translate it for you.",
    placeholderTextTemplate: "File selected. Provide context or click translate...",
    enableImageUpload: false, 
  },
];

export default function LanguageLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<LanguageLearningMode>(languageLearningModes[0].id);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());
  const [mindMapConfig, setMindMapConfig] = useState<{ initialTopic?: string; initialNodes?: InitialNodeData[] } | null>(null);
  
  // State for conversation practice setup
  const [isConversationSetupComplete, setIsConversationSetupComplete] = useState(false);
  const [currentConversationParams, setCurrentConversationParams] = useState<ConversationSetupParams | null>(null);


  const getStorageTopicForMode = useCallback((mode: LanguageLearningMode): string => {
    return languageLearningModes.find(m => m.id === mode)?.storageTopic || "LanguageTranslatorMode"; // Fallback
  }, []);

  const initializeNewSession = useCallback((mode: LanguageLearningMode) => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const modeTopic = getStorageTopicForMode(mode);
      const newId = `${modeTopic.replace(/\s+/g, '-').toLowerCase()}-${profileIdentifier}-${newTimestamp}`;

      setCurrentConversationId(newId);
      setChatKey(newId);
      
      setMindMapConfig(null); 
      setIsConversationSetupComplete(false); // Reset conversation setup status
      setCurrentConversationParams(null);

      if (searchParams.get('mode') !== mode || !searchParams.get('sessionId')) {
        router.push(`/language-learning?mode=${mode}`, { scroll: false });
      }
    }
  }, [profile, getStorageTopicForMode, router, searchParams]);


  useEffect(() => {
    if (!profile || profileLoading) return;

    const modeFromQuery = searchParams.get('mode') as LanguageLearningMode | null;
    const sessionIdFromQuery = searchParams.get('sessionId');
    let targetMode = modeFromQuery || activeMode;
    
    if (!languageLearningModes.find(m => m.id === targetMode)) {
        targetMode = languageLearningModes[0].id;
    }

    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation) {
        const foundModeConfig = languageLearningModes.find(m => m.storageTopic === conversation.topic);
        const conversationMode = foundModeConfig ? foundModeConfig.id : targetMode;

        setActiveMode(conversationMode);
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
        setMindMapConfig(null); 
        
        if (conversationMode === "conversation") {
            // For existing conversation sessions, assume setup was done.
            // We might need to extract params from the first messages if we want to "resume" setup state.
            // For now, just mark setup as complete to show chat.
            setIsConversationSetupComplete(true);
            // Extract/reconstruct params if possible, or use defaults
            const firstUserMsg = conversation.messages.find(m => m.sender === 'user');
            const firstAiMsg = conversation.messages.find(m => m.sender === 'ai');
            // This is a simplified way to reconstruct, real params might be in AI context
            setCurrentConversationParams({
                scenario: conversation.topic || "Conversation Practice",
                userLanguage: profile.preferredLanguage, // Guess
                aiLanguage: languageLearningModes.find(l => l.id === 'conversation')?.initialSystemMessageTemplate?.includes('French') ? 'fr' : 'en', // Wild guess
                difficulty: 'intermediate', // Default
                // userRole and aiRole would be harder to get without specific storage
            });
        } else {
            setIsConversationSetupComplete(false);
        }


        if (modeFromQuery !== conversationMode) {
            router.replace(`/language-learning?sessionId=${sessionIdFromQuery}&mode=${conversationMode}`, { scroll: false });
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
  
  const activeModeConfig = languageLearningModes.find(m => m.id === activeMode) || languageLearningModes[0];


  const handleModeChange = useCallback((newMode: LanguageLearningMode) => {
    setActiveMode(newMode); 
    initializeNewSession(newMode); 
  }, [initializeNewSession]);


  const handleNewSessionClick = useCallback(() => {
    initializeNewSession(activeMode);
  }, [activeMode, initializeNewSession]);

  const handleConversationSetupComplete = useCallback((params: ConversationSetupParams) => {
    setCurrentConversationParams(params);
    setIsConversationSetupComplete(true);
    // The DynamicChatInterface will be re-rendered by the parent with new props
  }, []);


  const getInitialMessageForMode = (modeConfig: ModeConfig, currentProfile: UserProfile, convParams?: ConversationSetupParams | null) => {
    if (modeConfig.id === 'conversation' && convParams) {
      let userRoleDesc = convParams.userRole ? ` as a ${convParams.userRole}` : "";
      let aiRoleDesc = convParams.aiRole ? ` act as a ${convParams.aiRole}` : "";
      return `Hi ${currentProfile.name}! Let's practice a conversation.
Scenario: "${convParams.scenario}"
Your Language${userRoleDesc}: ${LANGUAGES.find(l=>l.value === convParams.userLanguage)?.label || convParams.userLanguage}
AI's Language${aiRoleDesc}: ${LANGUAGES.find(l=>l.value === convParams.aiLanguage)?.label || convParams.aiLanguage}
Difficulty: ${convParams.difficulty.charAt(0).toUpperCase() + convParams.difficulty.slice(1)}
The AI will start the conversation.`;
    }
    
    let initialMessage = modeConfig.initialSystemMessageTemplate?.replace('${profileName}', currentProfile.name) || `Hi ${currentProfile.name}! Welcome to ${modeConfig.label}.`;
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
  
  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Language Tools...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Language Translator, we need your profile information. Please complete the onboarding process first.
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
        <p className="mt-4 text-muted-foreground">Initializing translator...</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col pt-0 bg-gradient-to-br from-background via-primary/5 to-background">
       <div className="mb-4 pt-0 mt-0 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primary flex items-center">
                  <Languages className="mr-2 h-6 w-6 sm:mr-3 sm:h-7 sm:w-7 md:h-8 md:w-8 text-chart-2"/> Language Studio
              </h1>
          </div>
          <Button 
            onClick={handleNewSessionClick} 
            variant="outline" 
            size="xs" 
            className="whitespace-nowrap text-xs h-8 px-2.5 py-1 sm:h-9 sm:px-3 sm:text-sm hover:bg-primary/10 hover:border-primary transition-all self-start sm:self-center">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New Session ({activeModeConfig.label})
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 sm:text-sm sm:text-left">
          Your AI-powered multilingual assistant. Current mode: {activeModeConfig.label}
        </p>
      </div>

      <div className="flex justify-center mb-4 sm:mb-6 px-4 sm:px-0">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex flex-wrap justify-center gap-1">
          {languageLearningModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <Button
                key={mode.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => handleModeChange(mode.id)}
                className={cn(
                  "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1.5 sm:gap-2",
                  isActive && "shadow-md bg-background text-primary font-semibold"
                )}
                aria-pressed={isActive}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {mode.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-grow min-h-0 w-full max-w-4xl mx-auto bg-card shadow-xl rounded-xl border border-border/60 overflow-hidden px-0 sm:px-0">
        {profile && currentConversationId && chatKey && (
          <>
            {activeMode === "voice" ? (
              <VoiceTranslatorInterface
                key={chatKey}
                userProfile={profile}
                conversationId={currentConversationId}
                topic={getStorageTopicForMode("voice")} 
              />
            ) : activeMode === "document" ? (
                <DocumentTranslatorInterface
                    key={chatKey}
                    userProfile={profile}
                    conversationId={currentConversationId}
                    topic={getStorageTopicForMode("document")}
                />
            ) : activeMode === "camera" ? ( 
                <ImageTextTranslatorInterface
                    key={chatKey}
                    userProfile={profile}
                    conversationId={currentConversationId}
                    topic={getStorageTopicForMode("camera")}
                />
            ) : activeMode === "conversation" ? (
                !isConversationSetupComplete || !currentConversationParams ? (
                    <ConversationPracticeSetup
                        userPreferredLanguage={profile.preferredLanguage}
                        onSetupComplete={handleConversationSetupComplete}
                    />
                ) : (
                    <DynamicChatInterface
                        key={chatKey}
                        userProfile={profile}
                        topic={activeModeConfig.storageTopic} 
                        conversationId={currentConversationId}
                        initialSystemMessage={getInitialMessageForMode(activeModeConfig, profile, currentConversationParams)}
                        placeholderText={`Speak in ${LANGUAGES.find(l=>l.value === currentConversationParams.userLanguage)?.label || currentConversationParams.userLanguage}...`}
                        enableImageUpload={activeModeConfig.enableImageUpload}
                        // Pass conversation params to AI via context or new prop if ChatInterface is adapted
                        context={{ // Example of passing context, actual implementation depends on ChatInterface/AI flow
                            subject: "Language Practice",
                            lesson: currentConversationParams.scenario,
                            // Potentially add more structured context for the AI flow
                            conversationScenario: currentConversationParams.scenario,
                            userLanguageRole: `${LANGUAGES.find(l=>l.value === currentConversationParams.userLanguage)?.label || currentConversationParams.userLanguage}-speaking ${currentConversationParams.userRole || 'user'}`,
                            aiLanguageRole: `${LANGUAGES.find(l=>l.value === currentConversationParams.aiLanguage)?.label || currentConversationParams.aiLanguage}-speaking ${currentConversationParams.aiRole || 'AI'}`,
                            conversationDifficulty: currentConversationParams.difficulty,
                        }}
                    />
                )
            ) : (  // Fallback for any other mode or if none matched correctly
              <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={activeModeConfig.storageTopic} 
                conversationId={currentConversationId}
                initialSystemMessage={getInitialMessageForMode(activeModeConfig, profile)}
                placeholderText={activeModeConfig.placeholderTextTemplate}
                enableImageUpload={activeModeConfig.enableImageUpload}
              />
            )}
          </>
        )}
      </div>
       <div className="text-center mt-6 py-2 px-4 sm:px-0">
            <Sparkles className="h-5 w-5 text-accent mx-auto mb-1.5 opacity-80"/>
            <p className="text-xs text-muted-foreground">
              {activeModeConfig.description} Your preferred language is {profile.preferredLanguage}.
            </p>
        </div>
    </div>
  );
}
    
