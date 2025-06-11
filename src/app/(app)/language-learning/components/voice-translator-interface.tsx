
"use client";

import { useState, useEffect, useRef } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mic, MicOff, Volume2, AlertCircle, Settings2, Languages, Info, Sparkles } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation, getConversationById } from '@/lib/chat-storage';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VoiceTranslatorInterfaceProps {
  userProfile: UserProfile;
  conversationId: string;
  topic: string; 
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported by your browser. Try Chrome or Edge.");
      setHasPermission(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => {
        setHasPermission(false);
        setError("Microphone access denied. Please enable it in your browser settings.");
      });

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = userProfile.preferredLanguage.split('-')[0] || 'en-US';

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
      let errMessage = `Speech recognition error: ${event.error}.`;
      if (event.error === 'no-speech') errMessage = "No speech detected. Please try speaking clearly.";
      if (event.error === 'audio-capture') errMessage = "Audio capture failed. Is your microphone working?";
      if (event.error === 'not-allowed') errMessage = "Microphone access was denied. Please enable permissions.";
      setError(errMessage);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (isListening && !isLoadingAI) {
         setIsListening(false);
      }
    };
    setRecognitionInstance(recognition);
    return () => {
      if (recognitionInstance) recognitionInstance.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.preferredLanguage]); 

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
      if (transcript.trim() || interimTranscript.trim()) { 
        handleSubmitTranscript(transcript.trim() + interimTranscript.trim());
      }
    } else {
      setTranscript(''); 
      setInterimTranscript(''); 
      setAiResponse(null); 
      setError(null);
      try {
        recognitionInstance.start();
        setIsListening(true);
      } catch (e) {
        setError("Failed to start microphone. It might be in use by another app.");
        setIsListening(false);
      }
    }
  };
  
  const handleSubmitTranscript = async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      toast({ title: "No input", description: "Nothing to translate.", variant: "default" });
      setIsListening(false); 
      if (recognitionInstance) recognitionInstance.stop();
      return;
    }
    setIsLoadingAI(true);
    setError(null);
    setIsListening(false); 
    if (recognitionInstance) recognitionInstance.stop();

    const userMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user',
      text: `User spoke: "${textToTranslate}". Please translate this.`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "LanguageTranslatorMode", // Use the generic translator mode for voice
        question: `Translate the following spoken text: "${textToTranslate}"`,
      };
      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        const newAiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: result.response,
          suggestions: result.suggestions, timestamp: Date.now(),
        };
        setAiResponse(newAiMessage);
        addMessageToConversation(conversationId, topic, newAiMessage, userProfile);
        setTranscript(prev => prev + textToTranslate + " "); 
        setInterimTranscript(''); 
      } else { throw new Error("AI response was empty."); }
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
    const preferredLangForTTS = userProfile.preferredLanguage; 
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = voices.find(voice => voice.lang.startsWith(preferredLangForTTS.split('-')[0]));
    if (!targetVoice) targetVoice = voices.find(voice => voice.lang.startsWith('en')); 
    
    if (targetVoice) utterance.voice = targetVoice;
    else utterance.lang = preferredLangForTTS; 

    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };

  if (hasPermission === null) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-6 p-8 text-center bg-card shadow-lg border border-border/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Requesting microphone permission...</p>
      </Card>
    );
  }
  if (hasPermission === false) {
     return (
      <Card className="w-full max-w-lg mx-auto mt-6 p-8 text-center bg-card shadow-lg border border-destructive/30">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <CardTitle className="text-xl mb-2 text-destructive">Microphone Access Denied</CardTitle>
        <CardDescription className="mb-6 text-muted-foreground">
            Voice translation requires microphone access. Please enable it in your browser settings and refresh this page.
        </CardDescription>
        <Button onClick={() => window.location.reload()} variant="outline" className="shadow-sm">
            <Settings2 className="mr-2 h-4 w-4"/>Check Permissions & Refresh
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col shadow-none border-0 min-h-[calc(100vh-25rem)] bg-transparent">
      <CardHeader className="text-center pb-4 pt-2">
        <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
            <Languages className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl sm:text-2xl text-gradient-primary">Real-time Voice Translator</CardTitle>
        <CardDescription className="text-sm">Speak naturally, get instant translations.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-4 flex flex-col items-center">
        <div className="my-4 sm:my-6">
          <Button
            onClick={toggleListening}
            disabled={isLoadingAI || hasPermission === false}
            size="lg"
            className={cn("rounded-full w-24 h-24 text-3xl shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95", 
                         isListening ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/50" : "bg-primary hover:bg-primary/90 ring-4 ring-primary/30"
            )}
            aria-label={isListening ? "Stop recording" : "Start recording"}
          >
            {isLoadingAI ? <Loader2 className="h-10 w-10 animate-spin" /> : isListening ? <MicOff className="h-10 w-10"/> : <Mic className="h-10 w-10"/>}
          </Button>
        </div>

        <ScrollArea ref={scrollAreaRef} className="w-full flex-grow border rounded-lg p-4 min-h-[200px] bg-muted/30 shadow-inner text-sm">
          {!transcript && !interimTranscript && !aiResponse && !error && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <Sparkles className="h-10 w-10 text-accent mb-3 opacity-70" />
              <p className="font-medium">{isListening ? "Listening attentively..." : "Press the microphone to begin speaking."}</p>
              <p className="text-xs mt-1">Your speech will appear here, followed by its translation.</p>
            </div>
          )}
          {transcript && (
             <div className="mb-3 p-3 rounded-md bg-background shadow-sm border border-border/50">
                <p className="font-semibold text-primary text-sm">You said:</p>
                <p className="whitespace-pre-wrap text-base">{transcript}</p>
             </div>
          )}
          {interimTranscript && (
            <p className="italic text-muted-foreground text-sm">Listening: {interimTranscript}</p>
          )}
          {aiResponse && (
            <div className={cn("mt-3 p-3 rounded-md shadow-sm border", aiResponse.text.startsWith("Error:") ? "bg-destructive/10 border-destructive/50" : "bg-green-500/10 border-green-500/50")}>
              <p className={cn("font-semibold text-sm", aiResponse.text.startsWith("Error:") ? "text-destructive" : "text-green-700 dark:text-green-400")}>
                {aiResponse.text.startsWith("Error:") ? "AI Error:" : "Translation:"}
              </p>
              <p className="whitespace-pre-wrap text-base">{aiResponse.text.replace(/^Error: /, '')}</p>
              {!aiResponse.text.startsWith("Error:") && (
                <Button onClick={speakResponse} variant="outline" size="sm" className="mt-2.5 shadow-sm hover:bg-accent/50">
                  <Volume2 className="mr-2 h-4 w-4" /> Speak Translation
                </Button>
              )}
            </div>
          )}
           {error && !aiResponse?.text.startsWith("Error:") && (
                <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    <Info className="inline h-4 w-4 mr-1.5 align-text-bottom"/> {error}
                </div>
            )}
        </ScrollArea>
         <p className="text-xs text-muted-foreground text-center mt-2">
            Recognition Language: {recognitionInstance?.lang || "default"}. AI will translate to/from your preferred language ({userProfile.preferredLanguage}).
        </p>
      </CardContent>
    </Card>
  );
};

export default VoiceTranslatorInterface;

