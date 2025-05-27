
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Mic, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import VoiceTranslatorInterface from "@/app/(app)/language-learning/components/voice-translator-interface"; // Re-use the component
import { getConversationById } from "@/lib/chat-storage";

const VOICE_TRANSLATION_TOPIC = "Language Voice Translation";

export default function VoiceTranslatorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString()); // Used as a key to force re-mount

  const initializeNewSession = (profileIdentifier: string) => {
    const newTimestamp = Date.now();
    const newId = `lang-voice-${profileIdentifier}-${newTimestamp}`;
    setCurrentConversationId(newId);
    setChatKey(newId); // Force re-render of VoiceTranslatorInterface
  };

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      const storedConversation = getConversationById(sessionIdFromQuery);
      if (storedConversation && storedConversation.topic === VOICE_TRANSLATION_TOPIC) {
          setCurrentConversationId(sessionIdFromQuery);
          setChatKey(sessionIdFromQuery); // Use session ID as key
      } else {
        router.replace('/voice-translator');
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
    router.push('/voice-translator', { scroll: false });
    if (profile) {
      initializeNewSession(profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Voice Translator...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Voice Translator, we need your profile information. Please complete the onboarding process first.
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
       <p className="mt-4 text-muted-foreground">Initializing voice session...</p>
     </div>
   );
 }

  return (
    <div className="h-full flex flex-col pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pt-0 mt-0">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                <Mic className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Voice Translator
            </h1>
            <p className="text-muted-foreground mt-1">Speak and get instant voice translations.</p>
        </div>
        <Button onClick={handleNewSession} variant="outline" className="mt-3 sm:mt-0">
          <RotateCcw className="mr-2 h-4 w-4" /> New Voice Session
        </Button>
      </div>
      <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
        {profile && currentConversationId && (
            <VoiceTranslatorInterface
                key={chatKey} // Use chatKey to force re-mount on new session
                userProfile={profile}
                conversationId={currentConversationId}
                topic={VOICE_TRANSLATION_TOPIC}
            />
        )}
      </div>
    </div>
  );
}
