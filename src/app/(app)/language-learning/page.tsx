
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type, Mic, MessageSquarePlus, Camera as CameraIcon, Sparkles, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getConversationById } from "@/lib/chat-storage";
// VoiceTranslatorInterface is not used in this version as per the screenshot showing "Coming Soon"
// import VoiceTranslatorInterface from "./components/voice-translator-interface";

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
  actionText: string;
}

const modeOptions: ModeOption[] = [
  { value: "text", label: "Text", icon: Type, description: "Translate typed text between languages.", actionText: "" }, // No action text for the active one
  { value: "voice", label: "Voice", icon: Mic, description: "Speak and get instant voice translations.", actionText: "Start Recording" },
  { value: "conversation", label: "Conversation", icon: MessageSquarePlus, description: "Have a bilingual conversation with AI assistance.", actionText: "Start Conversation" },
  { value: "camera", label: "Camera", icon: CameraIcon, description: "Translate text from images using your camera or by uploading.", actionText: "Upload or Scan Image" },
];

const getStorageTopicForMode = (mode: TranslationMode): string => `lang-${mode}-mode`;

const ComingSoonCard = ({ mode, onSwitchToText }: { mode: ModeOption, onSwitchToText: () => void }) => {
  const IconComponent = mode.icon;
  return (
    <Card className="w-full max-w-lg mx-auto mt-8 text-center shadow-xl">
      <CardHeader className="pt-8">
        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
          <IconComponent className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">{mode.label} Translation</CardTitle>
        <CardDescription>{mode.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" disabled className="w-full my-4">
          <PlayCircle className="mr-2 h-4 w-4"/> {mode.actionText} (Coming Soon)
        </Button>
        <p className="text-sm text-muted-foreground">
          The "{mode.label} Translation" feature is currently under development and will be available soon!
        </p>
        <div className="mt-4">
            <Sparkles className="h-8 w-8 text-accent mx-auto opacity-70"/>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-center gap-3 pb-8">
        <Button onClick={onSwitchToText} className="w-full max-w-xs">
          Switch to Text Translation
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function LanguageTranslatorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');
  const [activeMode, setActiveMode] = useState<TranslationMode>("text");

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    let modeFromStorage: TranslationMode = "text";

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
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile]);

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

  const renderContent = () => {
    if (!profile || !currentConversationId || !chatKey) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading interface...</p></div>;
    }
    if (activeMode === "text") {
        return (
          <DynamicChatInterface
            key={chatKey}
            userProfile={profile}
            topic={getStorageTopicForMode("text")}
            conversationId={currentConversationId}
            initialSystemMessage={initialChatMessageTextMode}
            placeholderText="E.g., Translate 'How are you?' to German"
            enableImageUpload={false} // Image upload disabled for text-only translation
          />
        );
    } else {
        const selectedModeConfig = modeOptions.find(opt => opt.value === activeMode);
        if (selectedModeConfig) {
            return <ComingSoonCard mode={selectedModeConfig} onSwitchToText={() => handleModeChange("text")} />;
        }
        return <p>Error: Invalid mode selected.</p>;
    }
  };

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text, and soon voice, conversations, and images.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg shadow-sm flex space-x-1">
          {modeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeMode === option.value ? "secondary" : "ghost"}
              onClick={() => handleModeChange(option.value)}
              className={cn(
                "px-3 py-1.5 h-auto text-sm rounded-md flex items-center gap-1.5",
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
