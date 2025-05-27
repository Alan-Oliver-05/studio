
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type as TypeIcon, Mic, MessagesSquare, Camera as CameraIcon } from "lucide-react";
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
  storageTopic: string;
  initialMessage?: string;
  enableImageUpload?: boolean;
}

const modes: ModeConfig[] = [
  {
    id: "text", label: "Text", icon: TypeIcon, description: "Translate typed text and get contextual explanations.", storageTopic: "Language Text Translation",
    initialMessage: "Welcome to Text Translator! Type text and specify target language (e.g., 'Translate hello to Spanish'). I can also explain grammar or usage.", enableImageUpload: false
  },
  {
    id: "voice", label: "Voice", icon: Mic, description: "Speak and get instant voice translations.", storageTopic: "Language Voice Translation"
    // VoiceTranslatorInterface handles its own initial setup
  },
  {
    id: "conversation", label: "Conversation", icon: MessagesSquare, description: "Practice bilingual dialogues with an AI partner.", storageTopic: "Language Conversation Practice",
    initialMessage: "Let's practice a conversation! Tell me the scenario, your role/language, and my role/language. For example: 'I want to order food. I'll be the customer in English, and you be the waiter in French.'", enableImageUpload: false
  },
  {
    id: "camera", label: "Camera", icon: CameraIcon, description: "Translate text from images captured or uploaded.", storageTopic: "Language Camera Translation",
    initialMessage: "Upload an image with text, and I'll do my best to translate it. Please also specify the target language if it's not obvious.", enableImageUpload: true
  },
];

export default function LanguageLearningPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<TranslationMode>("text");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());

  const getStorageTopicForMode = (mode: TranslationMode): string => {
    return modes.find(m => m.id === mode)?.storageTopic || "Language Translator General";
  };

  const initializeNewSession = (mode: TranslationMode) => {
    if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `${getStorageTopicForMode(mode).replace(/\s+/g, '-').toLowerCase()}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
      router.push(`/language-learning?mode=${mode}`, { scroll: false });
    }
  };

  useEffect(() => {
    const modeFromQuery = searchParams.get('mode') as TranslationMode | null;
    const sessionIdFromQuery = searchParams.get('sessionId');
    let targetMode = modeFromQuery || activeMode; // Prioritize query, then current state

    if (sessionIdFromQuery) {
      const conversation = getConversationById(sessionIdFromQuery);
      if (conversation) {
        const foundModeConfig = modes.find(m => m.storageTopic === conversation.topic);
        if (foundModeConfig) {
            targetMode = foundModeConfig.id; // Mode from stored conversation takes precedence
        }
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
        // Ensure URL reflects the authoritative mode from conversation if different
        if (targetMode !== (searchParams.get('mode') || 'text')) {
            router.replace(`/language-learning?sessionId=${sessionIdFromQuery}&mode=${targetMode}`, { scroll: false });
        }
      } else {
        // Invalid sessionId, initialize new session for targetMode
        initializeNewSession(targetMode);
      }
    } else {
      // No sessionId, initialize new session for targetMode (from URL or default 'text')
      initializeNewSession(targetMode);
    }
     if (activeMode !== targetMode) { // Sync local activeMode state if needed
        setActiveMode(targetMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile]); // Removed activeMode from dependencies to avoid loops

  const handleModeChange = (newMode: TranslationMode) => {
    // Only re-initialize if mode actually changes and there's no active session restoring
    if (newMode !== activeMode || !searchParams.get('sessionId')) {
      initializeNewSession(newMode);
    } else {
      // If mode is the same but we want to ensure URL reflects it (e.g. after clearing session ID)
      router.push(`/language-learning?mode=${newMode}`, { scroll: false });
      setActiveMode(newMode); // Ensure local state is also set
    }
  };

  const handleNewSessionClick = () => {
    initializeNewSession(activeMode);
  };

  const activeModeConfig = modes.find(m => m.id === activeMode) || modes[0];

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

   if (!currentConversationId || !chatKey) {
     return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing translator...</p>
      </div>
    );
  }

  const getInitialMessageForMode = (modeConfig: ModeConfig) => {
    return modeConfig.initialMessage?.replace('${profile.name}', profile.name) || `Hello ${profile.name}! Welcome to ${modeConfig.label} Translation.`;
  }

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text, voice, conversations, and from images.</p>
        </div>
        <Button onClick={handleNewSessionClick} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session ({activeModeConfig.label})
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {modes.map((mode) => (
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
            aria-label={`Switch to ${mode.label} translation mode`}
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
        {profile && currentConversationId && chatKey && (
          <>
            {activeMode === "text" && (
              <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={getStorageTopicForMode("text")}
                conversationId={currentConversationId}
                initialSystemMessage={getInitialMessageForMode(modes.find(m=>m.id==='text')!)}
                placeholderText="E.g., Translate 'How are you?' to German"
                enableImageUpload={false}
              />
            )}
            {activeMode === "voice" && (
              <VoiceTranslatorInterface
                key={chatKey}
                userProfile={profile}
                conversationId={currentConversationId}
                topic={getStorageTopicForMode("voice")}
              />
            )}
            {activeMode === "conversation" && (
              <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={getStorageTopicForMode("conversation")}
                conversationId={currentConversationId}
                initialSystemMessage={getInitialMessageForMode(modes.find(m=>m.id==='conversation')!)}
                placeholderText="Start the conversation or give instructions..."
                enableImageUpload={false}
              />
            )}
            {activeMode === "camera" && (
              <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={getStorageTopicForMode("camera")}
                conversationId={currentConversationId}
                initialSystemMessage={getInitialMessageForMode(modes.find(m=>m.id==='camera')!)}
                placeholderText="Upload an image and specify target language..."
                enableImageUpload={true}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

    