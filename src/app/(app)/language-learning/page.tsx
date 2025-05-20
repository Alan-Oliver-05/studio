
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Languages, RotateCcw, Type, Mic, MessageCircle, Camera as CameraIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

type TranslationMode = "text" | "voice" | "conversation" | "camera";

interface ModeOption {
  value: TranslationMode;
  label: string;
  icon: React.ElementType;
}

const modeOptions: ModeOption[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "voice", label: "Voice", icon: Mic },
  { value: "conversation", label: "Conversation", icon: MessageCircle },
  { value: "camera", label: "Camera", icon: CameraIcon },
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
      setCurrentConversationId(sessionIdFromQuery);
      setChatKey(sessionIdFromQuery);
      // Potentially restore activeMode if it were saved with session
    } else if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const defaultId = `language-translator-${activeMode}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(defaultId);
      setChatKey(defaultId);
    }
  }, [searchParams, profile, activeMode]); // Added activeMode to dependencies

  const handleNewSession = () => {
    setActiveMode("text"); // Reset to text mode
    router.push('/language-learning', { scroll: false });
    if (profile) {
        const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
        const newTimestamp = Date.now();
        // Ensure new ID is generated based on the reset mode (text)
        const newId = `language-translator-text-${profileIdentifier}-${newTimestamp}`;
        setCurrentConversationId(newId);
        setChatKey(newId);
    }
  };

  const handleModeChange = (mode: TranslationMode) => {
    setActiveMode(mode);
    // Generate a new conversation ID when mode changes, unless we are loading a specific session
    if (profile && !searchParams.get('sessionId')) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      const newTimestamp = Date.now();
      const newId = `language-translator-${mode}-${profileIdentifier}-${newTimestamp}`;
      setCurrentConversationId(newId);
      setChatKey(newId);
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

  const initialChatMessage = `Hello ${profile.name}! Welcome to the Language Translator. What text would you like to translate, and to which language? For example, "Translate 'Hello, how are you?' to Spanish."`;

  const renderContent = () => {
    if (activeMode === "text") {
      return (
        <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
          {chatKey && currentConversationId && (
            <DynamicChatInterface
              key={chatKey}
              userProfile={profile}
              topic="LanguageTranslatorMode"
              conversationId={currentConversationId}
              initialSystemMessage={initialChatMessage}
              placeholderText="Enter text to translate..."
            />
          )}
        </div>
      );
    } else {
      const selectedModeDetails = modeOptions.find(m => m.value === activeMode);
      return (
        <div className="flex flex-col items-center justify-center flex-grow p-8 max-w-2xl w-full mx-auto">
          <Card className="w-full text-center shadow-xl">
            <CardHeader>
              <div className="mx-auto bg-accent/10 rounded-full p-4 w-fit mb-4">
                {selectedModeDetails && <selectedModeDetails.icon className="h-12 w-12 text-accent" />}
              </div>
              <CardTitle className="text-2xl">{selectedModeDetails?.label} Translation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The "{selectedModeDetails?.label} Translation" feature is currently under development and will be available soon!
              </p>
            </CardContent>
            <CardFooter className="justify-center">
               <Button variant="outline" onClick={() => handleModeChange("text")}>Switch to Text Translation</Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col mt-0 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pt-0 mt-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Languages className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Language Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text, voice, and more.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-2 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Translation Session
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
                "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-md flex items-center gap-1.5 sm:gap-2",
                activeMode === option.value && "shadow-md bg-background"
              )}
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

    