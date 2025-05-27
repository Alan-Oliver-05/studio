
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
  actionButtonLabel?: string;
  actionButtonIcon?: React.ElementType;
}

const modeOptions: ModeOption[] = [
  { value: "text", label: "Text", icon: Type, description: "Translate typed text between languages." },
  { value: "voice", label: "Voice", icon: Mic, description: "Speak and get instant voice translations.", actionButtonLabel: "Start Recording", actionButtonIcon: PlayCircle },
  { value: "conversation", label: "Conversation", icon: MessageSquarePlus, description: "Have a bilingual conversation with AI assistance.", actionButtonLabel: "Start Conversation", actionButtonIcon: MessageCircle },
  { value: "camera", label: "Camera", icon: CameraIcon, description: "Translate text from images using your camera or by uploading.", actionButtonLabel: "Upload or Scan", actionButtonIcon: UploadCloud },
];

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
      const storedConversation = localStorage.getItem(`eduai-conversation-${sessionIdFromQuery}`);
      let modeFromStorage: TranslationMode = "text";
      if (storedConversation) {
        try {
          const conversationData = JSON.parse(storedConversation);
          if (conversationData.topic && conversationData.topic.startsWith('lang-')) {
            const modePart = conversationData.topic.split('-')[1] as TranslationMode;
            if (['text', 'voice', 'conversation', 'camera'].includes(modePart)) {
              modeFromStorage = modePart;
            }
          }
        } catch (e) { console.error("Failed to parse conversation for mode", e); }
      }
      setActiveMode(modeFromStorage);
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
    } else if (profile) {
      initializeNewSessionForMode(activeMode, profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  }, [searchParams, profile]);

  const initializeNewSessionForMode = (mode: TranslationMode, profileIdentifier: string) => {
      const newTimestamp = Date.now();
      const newId = `lang-${mode}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
  };

  const handleNewSession = () => {
    router.push('/language-learning', { scroll: false });
    setActiveMode("text"); 
    if (profile) {
      initializeNewSessionForMode("text", profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  const handleModeChange = (mode: TranslationMode) => {
    setActiveMode(mode);
    // Always start a new session when mode changes to keep conversation contexts clean
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

  const ComingSoonPlaceholder = ({ mode }: { mode: ModeOption }) => (
    <Card className="w-full text-center shadow-xl bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center flex-grow p-6 max-w-lg mx-auto">
      <CardHeader className="p-2">
        <div className="mx-auto bg-primary/10 rounded-full p-5 w-fit mb-4">
          <mode.icon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">{mode.label} Translation</CardTitle>
        <CardDescription>{mode.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        {mode.actionButtonLabel && mode.actionButtonIcon && (
          <Button variant="outline" size="lg" disabled className="mt-4 w-full max-w-xs">
            <mode.actionButtonIcon className="mr-2 h-5 w-5" /> {mode.actionButtonLabel} (Coming Soon)
          </Button>
        )}
        {mode.value === "camera" && (
             <ImageDown data-ai-hint="translation camera" src="https://placehold.co/300x200.png" alt="Camera placeholder" width={300} height={200} className="mt-4 rounded-md opacity-50 mx-auto" />
        )}
        <p className="text-muted-foreground text-sm mt-6">
          The "{mode.label} Translation" feature is currently under development and will be available soon!
        </p>
        <Sparkles className="h-8 w-8 text-accent mx-auto mt-6 opacity-70" />
      </CardContent>
      <CardFooter className="justify-center pt-4 p-2">
         <Button variant="default" onClick={() => handleModeChange("text")}>Switch to Text Translation</Button>
      </CardFooter>
    </Card>
  );


  const renderContent = () => {
    if (activeMode === "text") {
      return (
        <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
          {chatKey && currentConversationId && (
            <DynamicChatInterface
              key={chatKey} // Topic should be specific to the mode to ensure proper AI handling
              userProfile={profile}
              topic="LanguageTranslatorMode" // This signals the AI to use translator specialization
              conversationId={currentConversationId}
              initialSystemMessage={initialChatMessageTextMode}
              placeholderText="E.g., Translate 'How are you?' to German"
              enableImageUpload={false} // Text mode doesn't need image upload directly in chat; camera mode would.
            />
          )}
        </div>
      );
    } else {
      const selectedModeDetails = modeOptions.find(m => m.value === activeMode);
      if (selectedModeDetails) {
        return <ComingSoonPlaceholder mode={selectedModeDetails} />;
      }
      return <p>Error: Mode not found.</p>; // Fallback
    }
  };

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pt-0 mt-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text, and soon voice, conversations, and images.</p>
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

      {renderContent()}
    </div>
  );
}


    