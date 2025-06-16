
"use client";

import { useState, useEffect, useRef } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Mic, MicOff, Volume2, AlertCircle, Settings2, Languages, Info, Sparkles, FileText, History, Star, ChevronDown, Send } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation, getConversationById } from '@/lib/chat-storage';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LANGUAGES } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const displayedTargetLanguages = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "es", label: "Spanish" },
];

const LanguageTabButton = ({ lang, isActive, onClick, isDropdownTrigger = false }: { lang: {value: string, label: string}, isActive?: boolean, onClick?: () => void, isDropdownTrigger?: boolean }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      "text-xs px-2.5 py-1 h-auto rounded-md font-medium",
      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5",
      isDropdownTrigger && "ml-1"
    )}
  >
    {lang.label}
    {isDropdownTrigger && <ChevronDown className="ml-1 h-3.5 w-3.5" />}
  </Button>
);


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
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const translationScrollRef = useRef<HTMLDivElement>(null);
  const [targetLang, setTargetLang] = useState<string>(LANGUAGES.find(l=>l.label.toLowerCase() === userProfile.preferredLanguage.toLowerCase())?.value || displayedTargetLanguages[0].value);


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
      if (isListening && !isLoadingAI) { // Only auto-stop if not already processing an AI request
         setIsListening(false);
         // Check if there's content to submit from a continuous listen that just ended
         // This check is now primarily handled in toggleListening when stopping
      }
    };
    setRecognitionInstance(recognition);
    return () => {
      if (recognitionInstance) recognitionInstance.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.preferredLanguage]); 

   useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTo({ top: transcriptScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    if (translationScrollRef.current) {
        translationScrollRef.current.scrollTo({ top: translationScrollRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [aiResponse]);


  const toggleListening = () => {
    if (!recognitionInstance || hasPermission === false) {
        toast({title: "Mic Error", description: error || "Cannot access microphone.", variant: "destructive"});
        return;
    }
    if (isListening) {
      recognitionInstance.stop(); // Stop listening first
      setIsListening(false);
      const fullTranscript = (transcript + " " + interimTranscript).trim();
      if (fullTranscript) { 
        handleSubmitTranscript(fullTranscript);
      } else {
        toast({ title: "No speech recorded", description: "Mic stopped. Nothing to translate.", variant: "default" });
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
        setError("Failed to start microphone. It might be in use by another app or a browser restriction.");
        setIsListening(false);
        toast({title: "Mic Start Error", description: "Could not start microphone.", variant: "destructive"});
      }
    }
  };
  
  const handleSubmitTranscript = async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      toast({ title: "No input", description: "Nothing to translate.", variant: "default" });
      setIsLoadingAI(false); // Ensure loading is false if nothing to submit
      return;
    }
    setIsLoadingAI(true);
    setError(null);
    // isListening is already false if this is called after stopping.

    const targetLangLabel = LANGUAGES.find(l => l.value === targetLang)?.label || targetLang;
    const userMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user',
      text: `User spoke: "${textToTranslate}". Request to translate to ${targetLangLabel}.`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "LanguageTranslatorMode", 
        question: `Translate the following spoken text: "${textToTranslate}" to ${targetLangLabel}.`,
      };
      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        const newAiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: result.response,
          suggestions: result.suggestions, timestamp: Date.now(),
        };
        setAiResponse(newAiMessage);
        addMessageToConversation(conversationId, topic, newAiMessage, userProfile);
        // Transcript state is already updated by recognition.onresult
        setInterimTranscript(''); // Clear interim after final submission
      } else { throw new Error("AI response was empty for voice translation."); }
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
      setTranscript(''); // Clear transcript for next recording
    }
  };

  const speakResponse = () => {
    if (!aiResponse || !aiResponse.text || typeof window.speechSynthesis === 'undefined' || aiResponse.text.startsWith("Error:")) {
      toast({title: "Cannot Speak", description: "No valid translation to speak or speech synthesis not supported.", variant: "destructive"});
      return;
    }
    const utterance = new SpeechSynthesisUtterance(aiResponse.text);
    const ttsLang = targetLang; 
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = voices.find(voice => voice.lang.startsWith(ttsLang.split('-')[0]));
    if (!targetVoice) targetVoice = voices.find(voice => voice.lang.startsWith(userProfile.preferredLanguage.split('-')[0])); // Fallback to user's pref lang
    if (!targetVoice) targetVoice = voices.find(voice => voice.lang.startsWith('en')); 
    
    if (targetVoice) utterance.voice = targetVoice;
    else utterance.lang = ttsLang; 

    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };

  if (hasPermission === null) {
    return (
      <Card className="w-full mx-auto mt-6 p-8 text-center bg-card shadow-lg border border-border/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Requesting microphone permission...</p>
      </Card>
    );
  }
  if (hasPermission === false) {
     return (
      <Card className="w-full mx-auto mt-6 p-8 text-center bg-card shadow-lg border border-destructive/30">
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

  const sourceLangLabel = recognitionInstance?.lang 
    ? (LANGUAGES.find(l => l.value.startsWith(recognitionInstance.lang.split('-')[0]))?.label || recognitionInstance.lang) 
    : "Your Default Mic Language";

  return (
    <Card className="w-full flex flex-col shadow-none border-0 min-h-[calc(100vh-25rem)] bg-transparent">
      <CardHeader className="pb-3 pt-2 border-b">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-muted-foreground mr-2">Translate from <span className="text-primary font-semibold">{sourceLangLabel}</span> to:</span>
            {displayedTargetLanguages.map(lang => (
              <LanguageTabButton key={lang.value} lang={lang} isActive={targetLang === lang.value} onClick={() => setTargetLang(lang.value)} />
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <LanguageTabButton lang={{value: "more_target", label: ""}} isDropdownTrigger={true}/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.filter(l => !displayedTargetLanguages.find(dtl => dtl.value === l.value)).map(lang => (
                  <DropdownMenuItem key={lang.value} onSelect={() => setTargetLang(lang.value)}>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch min-h-0">
        {/* Left Panel - Voice Input / Transcript */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 border rounded-xl bg-background shadow-sm min-h-[250px] md:min-h-0">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-primary flex items-center"><Mic className="h-4 w-4 mr-1.5"/>Your Speech</h3>
                <Button
                    onClick={toggleListening}
                    disabled={isLoadingAI || hasPermission === false}
                    size="default"
                    className={cn("rounded-full w-20 h-10 text-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95", 
                                isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary hover:bg-primary/90"
                    )}
                    aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                    {isLoadingAI && !isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : isListening ? <MicOff className="h-5 w-5"/> : <Mic className="h-5 w-5"/>}
                </Button>
            </div>
            <ScrollArea ref={transcriptScrollRef} className="flex-grow border rounded-md p-2.5 bg-muted/30 min-h-[150px] text-sm shadow-inner">
                {!transcript && !interimTranscript && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                    <Sparkles className="h-8 w-8 text-accent mb-2 opacity-70" />
                    <p className="font-medium text-xs">{isListening ? "Listening..." : "Click the mic to start speaking."}</p>
                    </div>
                )}
                {transcript && <p className="whitespace-pre-wrap">{transcript}</p>}
                {interimTranscript && <p className="italic text-muted-foreground">{interimTranscript}</p>}
                {error && !isListening && <div className="text-destructive p-1 text-xs"><Info className="inline h-3.5 w-3.5 mr-1"/>{error}</div>}
            </ScrollArea>
            {isListening && !isLoadingAI && (
                <Button onClick={toggleListening} variant="outline" size="sm" className="mt-3 w-full sm:w-auto self-center shadow-sm">Stop Recording & Translate</Button>
            )}
        </div>

        {/* Right Panel - Translation Output */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 border rounded-xl bg-background shadow-sm min-h-[250px] md:min-h-0">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center"><Languages className="h-4 w-4 mr-1.5"/>Translation ({LANGUAGES.find(l => l.value === targetLang)?.label || targetLang})</h3>
            <ScrollArea ref={translationScrollRef} className="flex-grow border rounded-md p-2.5 bg-muted/30 min-h-[150px] text-sm shadow-inner">
            {isLoadingAI && !aiResponse && <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto my-2" />}
            {!isLoadingAI && !aiResponse && <p className="text-muted-foreground text-xs italic p-1">Translation will appear here...</p>}
            {aiResponse && (
                <>
                    <p className={cn("whitespace-pre-wrap", aiResponse.text.startsWith("Error:") ? "text-destructive" : "")}>
                        {aiResponse.text.replace(/^Error: /, '')}
                    </p>
                    {!aiResponse.text.startsWith("Error:") && (
                        <Button onClick={speakResponse} variant="outline" size="xs" className="mt-2.5 shadow-sm hover:bg-accent/50">
                        <Volume2 className="mr-1.5 h-3.5 w-3.5" /> Speak
                        </Button>
                    )}
                </>
            )}
            </ScrollArea>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-center justify-between gap-2 p-3 border-t text-xs text-muted-foreground sm:flex-row">
        <p className="flex items-center">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 22.0002C17.523 22.0002 22.0002 17.523 22.0002 12.0002C22.0002 6.47731 17.523 2.00024 12.0002 2.00024C6.47731 2.00024 2.00024 6.47731 2.00024 12.0002C2.00024 17.523 6.47731 22.0002 12.0002 22.0002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.50024 12.0002L10.0962 14.5962L16.5002 8.19226" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            Powered by EduAI Voice Engine
        </p>
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={()=>toast({title:"History", description:"History feature coming soon."})}>
                <History className="h-4 w-4" />
                <span className="sr-only">History</span>
            </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={()=>toast({title:"Saved", description:"Saved translations feature coming soon."})}>
                <Star className="h-4 w-4" />
                 <span className="sr-only">Saved</span>
            </Button>
            <Button variant="link" size="xs" className="text-muted-foreground hover:text-primary p-0 h-auto text-xs" onClick={()=>toast({title:"Feedback", description:"Feedback system coming soon."})}>
                Send feedback
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VoiceTranslatorInterface;

