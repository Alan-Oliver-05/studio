
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { getConversationById } from "@/lib/chat-storage";

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

const CAMERA_TRANSLATION_TOPIC = "Language Camera Translation";

export default function CameraTranslatorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>('');

  const initializeNewSession = (profileIdentifier: string) => {
    const newTimestamp = Date.now();
    const newId = `lang-camera-${profileIdentifier}-${newTimestamp}`;
    setCurrentConversationId(newId);
    setChatKey(newId);
  };
  
  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const storedConversation = getConversationById(sessionIdFromQuery);
      if (storedConversation && storedConversation.topic === CAMERA_TRANSLATION_TOPIC) {
        setCurrentConversationId(sessionIdFromQuery);
        setChatKey(sessionIdFromQuery);
      } else {
        router.replace('/camera-translator');
        if (profile) {
          initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
        }
      }
    } else if (profile) {
      initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile, router]);

  const handleNewSession = () => {
    router.push('/camera-translator', { scroll: false });
    if (profile) {
      initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Camera Translator...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Camera Translator, we need your profile information. Please complete the onboarding process first.
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
        <p className="mt-4 text-muted-foreground">Initializing camera session...</p>
      </div>
    );
  }
  
  const initialChatMessage = `Hello ${profile.name}! Upload an image containing text you'd like to translate. Please also specify the target language if it's not obvious.`;

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Camera className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Camera Translator
            </h1>
            <p className="text-muted-foreground mt-1">Translate text from images using your camera or by uploading.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Camera Session
        </Button>
      </div>

      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
         {chatKey && currentConversationId && (
            <DynamicChatInterface
                key={chatKey}
                userProfile={profile}
                topic={CAMERA_TRANSLATION_TOPIC}
                conversationId={currentConversationId}
                initialSystemMessage={initialChatMessage}
                placeholderText="Upload an image and specify target language..."
                enableImageUpload={true} 
            />
         )}
      </div>
    </div>
  );
}
