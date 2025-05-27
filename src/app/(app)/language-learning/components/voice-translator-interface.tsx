
"use client";

import { useState, useEffect, useRef } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mic, MicOff, Volume2, AlertCircle, Settings2 } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation, getConversationById } from '@/lib/chat-storage';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VoiceTranslatorInterfaceProps {
  userProfile: UserProfile;
  conversationId: string;
  topic: string; // e.g., "lang-voice-mode"
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceTranslatorInterface: React.FC<VoiceTranslatorInterfaceProps> = ({ userProfile, conversationId, topic }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<MessageType | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported by your browser. Try Chrome or Edge.");
      return;
    }

    // Request microphone permission
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => {
        setHasPermission(false);
        setError("Microphone access denied. Please enable it in your browser settings.");
      });

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = userProfile.preferredLanguage.split('-')[0] || 'en-US'; // Use base language for recognition

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      let interimTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        } else {
          interimTranscriptChunk += event.results[i][0].transcript;
        }
      }
      if (finalTranscriptChunk) {
        setTranscript(prev => prev + finalTranscriptChunk + ' ');
      }
      setInterimTranscript(interimTranscriptChunk);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      let errMessage = `Speech recognition error: ${event.error}.`;
      if (event.error === 'no-speech') errMessage = "No speech detected. Please try speaking clearly.";
      if (event.error === 'audio-capture') errMessage = "Audio capture failed. Is your microphone working?";
      if (event.error === 'not-allowed') errMessage = "Microphone access was denied. Please enable permissions.";
      
      setError(errMessage);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // If was listening and not deliberately stopped by submit
      if (isListening && !isLoadingAI) {
        // Could auto-submit if transcript has content or restart listening
        // For now, just stop to avoid infinite loops on some browsers
         setIsListening(false);
      }
    };

    setRecognitionInstance(recognition);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.preferredLanguage]); // Only re-init if language changes or on mount

   useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript, aiResponse, interimTranscript]);


  const toggleListening = () => {
    if (!recognitionInstance || hasPermission === false) {
        toast({title: "Mic Error", description: error || "Cannot access microphone.", variant: "destructive"});
        return;
    }
    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
      if (transcript.trim() || interimTranscript.trim()) { // If there's something, submit
        handleSubmitTranscript(transcript.trim() + interimTranscript.trim());
      }
    } else {
      setTranscript(''); // Clear previous final transcript
      setInterimTranscript(''); // Clear previous interim
      setAiResponse(null); // Clear previous AI response
      setError(null);
      recognitionInstance.start();
      setIsListening(true);
    }
  };
  
  const handleSubmitTranscript = async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      toast({ title: "No input", description: "Nothing to translate.", variant: "default" });
      setIsListening(false); // ensure listening is stopped
      if (recognitionInstance) recognitionInstance.stop();
      return;
    }
    setIsLoadingAI(true);
    setError(null);
    setIsListening(false); // Stop listening while AI processes
    if (recognitionInstance) recognitionInstance.stop();


    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: `User spoke: "${textToTranslate}". Please translate this. (Target language can be inferred or ask if needed)`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "LanguageTranslatorMode",
        question: `Translate the following spoken text: "${textToTranslate}"`,
        // photoDataUri: undefined - No image for voice
      };
      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        const newAiMessage: MessageType = {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: result.response,
          suggestions: result.suggestions,
          timestamp: Date.now(),
        };
        setAiResponse(newAiMessage);
        addMessageToConversation(conversationId, topic, newAiMessage, userProfile);
        setTranscript(prev => prev + textToTranslate + " "); // Keep the final spoken text for display
        setInterimTranscript(''); // Clear interim
      } else {
        throw new Error("AI response was empty.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get translation.";
      setError(errorMessage);
      toast({ title: "Translation Error", description: errorMessage, variant: "destructive" });
       const errorAiMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: `Error: ${errorMessage}`, timestamp: Date.now(),
      };
      setAiResponse(errorAiMessage);
      addMessageToConversation(conversationId, topic, errorAiMessage, userProfile);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const speakResponse = () => {
    if (!aiResponse || !aiResponse.text || typeof window.speechSynthesis === 'undefined') {
      toast({title: "Cannot Speak", description: "No response to speak or speech synthesis not supported.", variant: "destructive"});
      return;
    }
    const utterance = new SpeechSynthesisUtterance(aiResponse.text);
    // Attempt to use a voice matching the AI's response language if possible
    // This is highly browser/OS dependent and might not always work perfectly
    const preferredLangForTTS = userProfile.preferredLanguage; // Or derive from AI's response if it indicates lang
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = voices.find(voice => voice.lang.startsWith(preferredLangForTTS.split('-')[0]));
    if (!targetVoice) targetVoice = voices.find(voice => voice.lang.startsWith('en')); // Fallback to English
    
    if (targetVoice) utterance.voice = targetVoice;
    else utterance.lang = preferredLangForTTS; // Fallback to setting lang on utterance

    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  };


  if (hasPermission === null) {
    return (
      <Card className="w-full max-w-md mx-auto mt-4 p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p>Requesting microphone permission...</p>
      </Card>
    );
  }
  if (hasPermission === false) {
     return (
      <Card className="w-full max-w-md mx-auto mt-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <CardTitle className="text-xl mb-2">Microphone Access Denied</CardTitle>
        <CardDescription className="mb-4">
            Voice translation requires microphone access. Please enable it in your browser settings and refresh the page.
        </CardDescription>
        <Button onClick={() => window.location.reload()}><Settings2 className="mr-2 h-4 w-4"/>Check Permissions & Refresh</Button>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col shadow-xl border min-h-[60vh]">
      <CardHeader className="text-center border-b pb-4">
        <CardTitle className="text-xl flex items-center justify-center">
          <Mic className="mr-2 h-6 w-6 text-primary" /> Voice Translator
        </CardTitle>
        <CardDescription>Speak in your language, get it translated!</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-4 flex flex-col">
        <div className="flex justify-center items-center my-4">
          <Button
            onClick={toggleListening}
            disabled={isLoadingAI || hasPermission === false}
            size="lg"
            className={cn("rounded-full w-20 h-20 text-2xl shadow-lg transition-all duration-150 ease-in-out", 
                         isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary hover:bg-primary/90"
            )}
            aria-label={isListening ? "Stop recording" : "Start recording"}
          >
            {isLoadingAI ? <Loader2 className="h-8 w-8 animate-spin" /> : isListening ? <MicOff className="h-8 w-8"/> : <Mic className="h-8 w-8"/>}
          </Button>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-grow border rounded-md p-3 min-h-[150px] bg-muted/30 text-sm">
          {!transcript && !interimTranscript && !aiResponse && !error && (
            <p className="text-muted-foreground text-center py-10">
              {isListening ? "Listening..." : "Press the mic to start speaking."}
            </p>
          )}
          {transcript && (
             <div className="mb-2 p-2 rounded bg-background shadow-sm">
                <p className="font-semibold text-primary">You said:</p>
                <p className="whitespace-pre-wrap">{transcript}</p>
             </div>
          )}
          {interimTranscript && (
            <p className="italic text-muted-foreground">Listening: {interimTranscript}</p>
          )}
          {aiResponse && (
            <div className={cn("mt-3 p-2 rounded shadow-sm", aiResponse.text.startsWith("Error:") ? "bg-destructive/10" : "bg-green-500/10")}>
              <p className={cn("font-semibold", aiResponse.text.startsWith("Error:") ? "text-destructive" : "text-green-700 dark:text-green-400")}>
                {aiResponse.text.startsWith("Error:") ? "AI Error:" : "Translation:"}
              </p>
              <p className="whitespace-pre-wrap">{aiResponse.text.replace(/^Error: /, '')}</p>
              {!aiResponse.text.startsWith("Error:") && (
                <Button onClick={speakResponse} variant="outline" size="sm" className="mt-2">
                  <Volume2 className="mr-2 h-4 w-4" /> Speak Translation
                </Button>
              )}
            </div>
          )}
           {error && !aiResponse?.text.startsWith("Error:") && <p className="text-destructive mt-2 text-center">{error}</p>}
        </ScrollArea>
         <p className="text-xs text-muted-foreground text-center mt-2">
            Current recognition language: {recognitionInstance?.lang || "default"}. Translations are to/from your preferred language.
        </p>
      </CardContent>
    </Card>
  );
};

export default VoiceTranslatorInterface;
