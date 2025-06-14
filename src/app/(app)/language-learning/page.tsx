
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type as TypeIcon, Mic, MessagesSquare, Camera as CameraIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const VoiceTranslatorInterface = dynamic(() =>
  import('./components/voice-translator-interface').then((mod) => mod.default),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

type TranslationMode = "text" | "voice" | "conversation" | "camera";

interface ModeConfig {
  id: TranslationMode;
  label: string;
  icon: React.ElementType;
  description: string;
  storageTopic: string; // This will be the `specificTopic` for the AI flow
  initialSystemMessageTemplate: string;
  placeholderTextTemplate: string;
  enableImageUpload: boolean;
}

const modes: ModeConfig[] = [
  {
    id: "text", label: "Text Translator", icon: TypeIcon, 
    description: "Translate typed text. Ask for grammar explanations or usage context.", 
    storageTopic: "Language Text Translation",
    initialSystemMessageTemplate: "Hello ${profileName}! I'm ready for text translation. Type your text and specify the target language (e.g., 'Translate 'hello' to Spanish'). You can also ask for grammar help!",
    placeholderTextTemplate: "E.g., Translate 'How are you?' to German, or explain this French phrase...",
    enableImageUpload: false
  },
  {
    id: "voice", label: "Voice Translator", icon: Mic, 
    description: "Speak and get instant voice translations. Supports multiple languages.", 
    storageTopic: "Language Voice Translation", // Will use LanguageTranslatorMode in AI Flow
    initialSystemMessageTemplate: "Hi ${profileName}! Use the mic to speak. I'll translate your words.", // Not directly used by VoiceTranslatorInterface
    placeholderTextTemplate: "Click mic and start speaking...", // Not directly used
    enableImageUpload: false
  },
  {
    id: "conversation", label: "Conversation Practice", icon: MessagesSquare, 
    description: "Practice bilingual dialogues with an AI partner in various scenarios.", 
    storageTopic: "Language Conversation Practice",
    initialSystemMessageTemplate: "Hi ${profileName}! Let's practice a conversation. Tell me the scenario, your role & language, and my role & language. E.g., 'I'm a tourist (English) asking for directions from a local (French).'",
    placeholderTextTemplate: "Describe the conversation scenario here...",
    enableImageUpload: false
  },
  {
    id: "camera", label: "Image Text Translator", icon: CameraIcon, 
    description: "Translate text from images captured or uploaded from your device.", 
    storageTopic: "Language Camera Translation", // Will use LanguageTranslatorMode in AI Flow with image
    initialSystemMessageTemplate: "Hello ${profileName}! Upload an image with text, and I'll translate it. Please also specify the target language if it's not your preferred one.",
    placeholderTextTemplate: "Upload an image and type target language if needed...",
    enableImageUpload: true
  },
];

export default function LanguageLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<TranslationMode>(modes[0].id);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());

  const getStorageTopicForMode = useCallback((mode: TranslationMode): string => {
    return modes.find(m => m.id === mode)?.storageTopic || "LanguageTranslatorMode"; // Fallback
  }, []);

  const initializeNewSession = useCallback((mode: TranslationMode) => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const modeTopic = getStorageTopicForMode(mode);
      const newId = `${modeTopic.replace(/\s+/g, '-').toLowerCase()}-${profileIdentifier}-${newTimestamp}`;

      setCurrentConversationId(newId);
      setChatKey(newId);
      if (searchParams.get('mode') !== mode || !searchParams.get('sessionId')) {
        router.push(`/language-learning?mode=${mode}`, { scroll: false });
      }
    }
  }, [profile, getStorageTopicForMode, router, searchParams]);


  useEffect(() => {
    if (!profile || profileLoading) return;

    const modeFromQuery = searchParams.get('mode') as TranslationMode | null;
    const sessionIdFromQuery = searchParams.get('sessionId');
    let targetMode = modeFromQuery || activeMode;

    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation) {
        const foundModeConfig = modes.find(m => m.storageTopic === conversation.topic);
        const conversationMode = foundModeConfig ? foundModeConfig.id : targetMode;

        setActiveMode(conversationMode);
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
        
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
  }, [searchParams, profile, profileLoading, initializeNewSession]); 
  
  const activeModeConfig = modes.find(m => m.id === activeMode) || modes[0];


  const handleModeChange = useCallback((newMode: TranslationMode) => {
    setActiveMode(newMode); 
    initializeNewSession(newMode); 
  }, [initializeNewSession]);


  const handleNewSessionClick = useCallback(() => {
    initializeNewSession(activeMode);
  }, [activeMode, initializeNewSession]);


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

  const getInitialMessageForMode = (modeConfig: ModeConfig, currentProfile: UserProfile) => {
    return modeConfig.initialSystemMessageTemplate.replace('${profileName}', currentProfile.name);
  }

  return (
    <div className="h-full flex flex-col pt-0 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0 px-1">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-chart-2"/> Language Studio
            </h1>
            <p className="text-muted-foreground mt-1">Your AI-powered multilingual assistant.</p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="mt-3 sm:mt-0 shadow-sm hover:bg-primary/10 hover:border-primary transition-all">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session ({activeModeConfig.label})
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <Card
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 flex flex-col items-center justify-center text-center group",
                "bg-card border-2 rounded-xl overflow-hidden w-full sm:w-48 md:w-52 lg:w-56 flex-shrink-0 h-36", 
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
              <CardHeader className="p-3 pt-4"> 
                 <div className={cn("p-1.5 rounded-full mb-1 transition-colors duration-300 w-fit mx-auto", 
                    isActive ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
                 )}>
                    <Icon className={cn("h-4 w-4 transition-colors duration-300", 
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                 </div>
                <CardTitle className={cn("text-xs font-medium transition-colors", 
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                    {mode.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 text-center flex-grow flex flex-col justify-center"> 
                   <CardDescription className="text-xs leading-snug text-muted-foreground">{mode.description}</CardDescription>
              </CardContent>
              {isActive && (
                <div className="w-full h-1 bg-primary mt-auto"></div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex-grow min-h-0 w-full max-w-4xl mx-auto bg-card shadow-xl rounded-xl border border-border/60 overflow-hidden">
        {profile && currentConversationId && chatKey && (
          <>
            {activeMode === "voice" ? (
              <VoiceTranslatorInterface
                key={chatKey}
                userProfile={profile}
                conversationId={currentConversationId}
                topic={getStorageTopicForMode("voice")} 
              />
            ) : ( // For text, conversation, camera
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
       <div className="text-center mt-6 py-2">
            <Sparkles className="h-5 w-5 text-accent mx-auto mb-1.5 opacity-80"/>
            <p className="text-xs text-muted-foreground">
              {activeModeConfig.label}: {activeModeConfig.description} Your preferred language is {profile.preferredLanguage}.
            </p>
        </div>
    </div>
  );
}

    
