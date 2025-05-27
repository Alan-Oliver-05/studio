
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type, Mic, MessageCircle, Camera as CameraIcon, Sparkles, UploadCloud, PlayCircle, MessageSquarePlus, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getConversationById } from "@/lib/chat-storage";
import VoiceTranslatorInterface from "./components/voice-translator-interface";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

type TranslationMode = "text" | "voice" | "conversation" | "camera";

interface ModeOption {
  value: TranslationMode;
  label: string;
  icon: React.ElementType;
  description: string;
}

const modeOptions: ModeOption[] = [
  { value: "text", label: "Text Translator", icon: Type, description: "Translate typed text between languages." },
  { value: "voice", label: "Voice Translator", icon: Mic, description: "Speak and get instant voice translations." },
  { value: "conversation", label: "Practice Conversation", icon: MessageSquarePlus, description: "Have a bilingual conversation with AI assistance." },
  { value: "camera", label: "Image Translator", icon: CameraIcon, description: "Translate text from images using your camera or by uploading." },
];

const getStorageTopicForMode = (mode: TranslationMode): string => `lang-${mode}-mode`;

export default function LanguageTranslatorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
  const [activeMode, setActiveMode] = useState<TranslationMode>("text");

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    let modeFromStorage: TranslationMode = "text"; // Default if no session or unrecognized topic

    if (sessionIdFromQuery) {
      const storedConversation = getConversationById(sessionIdFromQuery);
      if (storedConversation && storedConversation.topic && storedConversation.topic.startsWith('lang-')) {
        const modePart = storedConversation.topic.split('-')[1] as TranslationMode;
        if (modeOptions.some(opt => opt.value === modePart)) {
          modeFromStorage = modePart;
        }
      }
      setActiveMode(modeFromStorage);
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
    } else if (profile) {
      // When no session ID, initialize a new session based on the current activeMode (default 'text')
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile]); // activeMode removed from deps to avoid re-init loops when mode changes without session ID

  const initializeNewSessionForMode = (mode: TranslationMode, profileIdentifier: string) => {
      const newTimestamp = Date.now();
      const newId = `lang-${mode}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
  };

  const handleNewSession = () => {
    router.push('/language-learning', { scroll: false }); // Clear session ID from URL
    if (profile) {
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  const handleModeChange = (mode: TranslationMode) => {
    setActiveMode(mode);
    router.push('/language-learning', { scroll: false }); // Clear session ID from URL
    if (profile) {
        initializeNewSessionForMode(mode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Language Translator...</p>
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
  
  const initialChatMessageTextMode = `Hello ${profile.name}! Welcome to the Text Translator. What text would you like to translate, and to which language? For example: "Translate 'Hello, world!' to Spanish." or "How do I say 'Thank you very much' in French?"`;
  const initialChatMessageCameraMode = `Hi ${profile.name}! Use the Image Translator by uploading an image containing text. I'll try to extract the text and translate it for you. Tell me the target language if it's not obvious.`;
  const initialChatMessageConversationMode = `Let's practice a conversation, ${profile.name}! Tell me the scenario, your role/language, and the role/language you want me to play. For example: "I'm a tourist in Paris speaking English, and you are a shopkeeper speaking French. Let's talk about buying a souvenir."`;


  const renderContent = () => {
    if (!profile || !currentConversationId || !chatKey) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading interface...</p></div>;
    }
    switch (activeMode) {
      case "text":
        return (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={getStorageTopicForMode("text")}
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessageTextMode}
            placeholderText="E.g., Translate 'How are you?' to German"
            enableImageUpload={false}
          />
        );
      case "voice":
        return (
          <VoiceTranslatorInterface
            key={chatKey}
            userProfile={profile}
            conversationId={currentConversationId}
            topic={getStorageTopicForMode("voice")}
          />
        );
      case "conversation":
         return (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={getStorageTopicForMode("conversation")}
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessageConversationMode}
            placeholderText="Start the conversation scenario..."
            enableImageUpload={false}
          />
        );
      case "camera":
         return (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={getStorageTopicForMode("camera")}
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessageCameraMode}
            placeholderText="Upload an image and describe what to translate..."
            enableImageUpload={true}
          />
        );
      default:
        return <p className="text-center text-muted-foreground">Select a mode to begin.</p>;
    }
  };

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Select a mode to start translating or practicing.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {modeOptions.map((option) => (
          <Card
            key={option.value}
            onClick={() => handleModeChange(option.value)}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1",
              activeMode === option.value ? "ring-2 ring-primary border-primary shadow-xl bg-primary/5" : "bg-card hover:border-primary/30"
            )}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleModeChange(option.value)}
            role="button"
            aria-pressed={activeMode === option.value}
            aria-label={`Activate ${option.label} mode`}
          >
            <CardHeader className="items-center text-center p-4">
              <div className={cn("p-3 rounded-full mb-2 w-fit", activeMode === option.value ? "bg-primary/20" : "bg-muted")}>
                <option.icon className={cn("h-7 w-7", activeMode === option.value ? "text-primary" : "text-muted-foreground")} />
              </div>
              <CardTitle className={cn("text-md", activeMode === option.value ? "text-primary" : "text-card-foreground")}>{option.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-center px-4 pb-4 pt-0">
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}

