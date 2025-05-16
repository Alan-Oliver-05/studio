
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2, AlertTriangle, Brain, MessageCircle, Languages, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';

const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

export default function AITutorPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading AI Tutor...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0">
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
  
  const chatConversationId = `ai-tutor-chat-${profile.id || 'default'}`;
  const initialChatMessage = `Hello ${profile.name}! I'm your AI Learning Assistant. Ask me any question about your studies, homework, or concepts you'd like to understand better. You can also upload an image for context.`;

  return (
    <div className="h-full flex flex-col mt-0">
      <div className="mb-6 pt-0">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
            <Brain className="mr-3 h-8 w-8"/> AI Learning Assistant
        </h1>
        <p className="text-muted-foreground">Your multi-modal personal tutor.</p>
      </div>
      
      <Tabs defaultValue="chat" className="flex-grow flex flex-col">
        <TabsList className="mb-4 self-start">
          <TabsTrigger value="chat"><MessageCircle className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="language-learning"><Languages className="mr-2 h-4 w-4" />Language Learning</TabsTrigger>
          <TabsTrigger value="visual-learning"><BarChart3 className="mr-2 h-4 w-4" />Visual Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-grow flex flex-col min-h-0">
          <DynamicChatInterface
            userProfile={profile}
            topic="AI Learning Assistant Chat" 
            conversationId={chatConversationId}
            initialSystemMessage={initialChatMessage}
            placeholderText="Ask anything or upload an image..."
          />
        </TabsContent>
        <TabsContent value="language-learning" className="flex-grow">
          <Card>
            <CardHeader>
              <CardTitle>Language Learning Hub</CardTitle>
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
              <Button asChild>
                <Link href="/language-learning">Go to Language Learning Hub</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="visual-learning" className="flex-grow">
           <Card>
            <CardHeader>
              <CardTitle>Visual Learning Tools</CardTitle>
              <CardDescription>Understand complex topics visually. Explore concepts with AI-generated interactive graphs, charts, and flowcharts tailored to your learning needs.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Dynamic visualizations to simplify difficult concepts.</li>
                <li>Interactive elements to explore data and relationships (future).</li>
                <li>AI generation of custom diagrams based on your questions (future).</li>
                <li>Support for various chart types and flowcharts (future).</li>
              </ul>
              <p className="text-sm font-semibold text-primary mt-4">This feature is currently under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
