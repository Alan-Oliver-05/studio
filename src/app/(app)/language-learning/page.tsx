
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
import VoiceTranslatorInterface from "./components/voice-translator-interface"; // New component

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
  { value: "text", label: "Text", icon: Type, description: "Translate typed text between languages." },
  { value: "voice", label: "Voice", icon: Mic, description: "Speak and get instant voice translations." },
  { value: "conversation", label: "Conversation", icon: MessageSquarePlus, description: "Have a bilingual conversation with AI assistance." },
  { value: "camera", label: "Camera", icon: CameraIcon, description: "Translate text from images using your camera or by uploading." },
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
    if (sessionIdFromQuery) {
      const storedConversation = getConversationById(sessionIdFromQuery);
      let modeFromStorage: TranslationMode = "text";
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
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  }, [searchParams, profile, activeMode]); // activeMode dependency ensures re-init if mode changed without session ID

  const initializeNewSessionForMode = (mode: TranslationMode, profileIdentifier: string) => {
      const newTimestamp = Date.now();
      const newId = `lang-${mode}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
  };

  const handleNewSession = () => {
    router.push('/language-learning', { scroll: false });
    if (profile) {
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  const handleModeChange = (mode: TranslationMode) => {
    setActiveMode(mode);
    router.push('/language-learning', { scroll: false }); 
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
  const initialChatMessageCameraMode = `Hi ${profile.name}! Use the camera mode to translate text from images. Upload an image containing text, and I'll do my best to extract and translate it for you. For example, you can say "Translate the text in this image to German."`;
  const initialChatMessageConversationMode = `Hello ${profile.name}! Let's have a practice conversation. Tell me the scenario, your language, and the language of the person I should simulate. For example: "I want to order coffee. I'll speak English, you be the French barista." I will translate and help facilitate the dialogue.`;


  const renderContent = () => {
    if (!profile || !currentConversationId || !chatKey) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading interface...</p></div>;
    }
    switch(activeMode) {
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
      case "camera":
        return (
           <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={getStorageTopicForMode("camera")}
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessageCameraMode}
            placeholderText="Upload image and ask for translation, e.g., 'Translate this to French'"
            enableImageUpload={true}
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
            placeholderText="Type your part of the conversation..."
            enableImageUpload={false}
          />
        );
      default:
        return <p>Error: Mode not found.</p>; 
    }
  };

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pt-0 mt-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text, voice, images, and practice conversations.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-2 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex flex-wrap justify-center gap-1">
          {modeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeMode === option.value ? "secondary" : "ghost"}
              onClick={() => handleModeChange(option.value)}
              className={cn(
                "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1.5 sm:gap-2 transition-all",
                activeMode === option.value && "shadow-md bg-background text-primary font-semibold"
              )}
              aria-pressed={activeMode === option.value}
            >
              <option.icon className={cn("h-4 w-4", activeMode === option.value ? "text-primary" : "text-muted-foreground")} />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
