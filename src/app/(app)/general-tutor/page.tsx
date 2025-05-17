
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Brain, MessageCircle, Languages, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation'; 
import { useEffect, useState } from "react"; 

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function AITutorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const searchParams = useSearchParams();
  
  const [mainChatConversationId, setMainChatConversationId] = useState<string | null>(null);
  const [mainChatKey, setMainChatKey] = useState<string>(''); 

  const [visualLearningChatConversationId, setVisualLearningChatConversationId] = useState<string | null>(null);
  const [visualLearningChatKey, setVisualLearningChatKey] = useState<string>('');

  useEffect(() => {
    const sessionIdFromQuery = searchParams.get('sessionId');
    if (sessionIdFromQuery) {
      // This logic primarily applies if the /general-tutor page itself is revisited with a specific session ID
      // For distinct tabs, we'll use profile-based IDs.
      setMainChatConversationId(sessionIdFromQuery);
      setMainChatKey(sessionIdFromQuery); 
    } else if (profile) {
      const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
      
      // Main Chat
      const defaultMainChatId = `ai-tutor-chat-${profileIdentifier}`;
      setMainChatConversationId(defaultMainChatId);
      setMainChatKey(defaultMainChatId); 

      // Visual Learning Chat
      const defaultVisualLearningChatId = `visual-learning-focus-chat-${profileIdentifier}`;
      setVisualLearningChatConversationId(defaultVisualLearningChatId);
      setVisualLearningChatKey(defaultVisualLearningChatId);
    }
  }, [searchParams, profile]);


  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading AI Tutor...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the AI Tutor, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  if (!mainChatConversationId || !visualLearningChatConversationId) {
     return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing chat sessions...</p>
      </div>
    );
  }

  const initialMainChatMessage = `Hello ${profile.name}! I'm your AI Learning Assistant. Ask me any question about your studies, homework, or concepts you'd like to understand better. You can also upload an image for context.`;
  const initialVisualLearningChatMessage = `Hi ${profile.name}! Welcome to Visual Learning. How can I help you visualize a concept today? Ask me to explain something with a chart, diagram, or suggest an image. For example: "Explain photosynthesis with a diagram" or "Show me a bar chart of planet sizes."`;

  return (
    <div className="h-full flex flex-col mt-0 pt-0">
      <div className="mb-6 pt-0 mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
            <Brain className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> AI Learning Assistant
        </h1>
        <p className="text-muted-foreground mt-1">Your multi-modal personal tutor.</p>
      </div>
      
      <Tabs defaultValue="chat" className="flex-grow flex flex-col">
        <TabsList className="mb-4 self-start">
          <TabsTrigger value="chat"><MessageCircle className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="visual-learning"><BarChart3 className="mr-2 h-4 w-4" />Visual Learning</TabsTrigger>
          <TabsTrigger value="language-learning"><Languages className="mr-2 h-4 w-4" />Language Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-grow flex flex-col min-h-0">
          {mainChatKey && mainChatConversationId && (
            <DynamicChatInterface
              key={mainChatKey} 
              userProfile={profile}
              topic="AI Learning Assistant Chat" 
              conversationId={mainChatConversationId}
              initialSystemMessage={initialMainChatMessage}
              placeholderText="Ask anything or upload an image..."
            />
          )}
        </TabsContent>

        <TabsContent value="visual-learning" className="flex-grow flex flex-col min-h-0">
           {visualLearningChatKey && visualLearningChatConversationId && (
            <DynamicChatInterface
              key={visualLearningChatKey}
              userProfile={profile}
              topic="Visual Learning Focus"
              conversationId={visualLearningChatConversationId}
              initialSystemMessage={initialVisualLearningChatMessage}
              placeholderText="Ask for a visual explanation..."
            />
           )}
        </TabsContent>
        
        <TabsContent value="language-learning" className="flex-grow">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Language Learning Hub</CardTitle>
              <CardDescription>Master new languages with your AI assistant. Practice vocabulary, grammar, pronunciation (text-based), and engage in interactive conversations. Get instant feedback and translations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Interactive lessons tailored to your level.</li>
                <li>AI-powered translations and grammar explanations.</li>
                <li>Practice conversations in your target language.</li>
                <li>Vocabulary building exercises and tips.</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="accent">
                <Link href="/language-learning">Go to Language Learning Hub</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
