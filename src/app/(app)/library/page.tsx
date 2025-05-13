"use client";

import { useEffect, useState } from "react";
import { getConversations, formatConversationForAI } from "@/lib/chat-storage";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import type { Conversation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, LibraryBig, AlertTriangle, MessageSquareText, CalendarDays, FileText } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});
  const [timeAgo, setTimeAgo] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const convos = getConversations();
      setConversations(convos);
    } catch (e) {
      console.error("Failed to load conversations:", e);
      setError("Failed to load conversation history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      const calculateTimes = () => {
        const updatedTimeAgo: Record<string, string> = {};
        conversations.forEach(convo => {
          updatedTimeAgo[convo.id] = formatDistanceToNow(new Date(convo.lastUpdatedAt), { addSuffix: true });
        });
        setTimeAgo(updatedTimeAgo);
      };
      calculateTimes(); // Initial calculation
      const intervalId = setInterval(calculateTimes, 60000); // Update every minute
      return () => clearInterval(intervalId);
    }
  }, [conversations]);

  const handleGenerateSummary = async (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      toast({ title: "Cannot Summarize", description: "This conversation has no messages.", variant: "destructive" });
      return;
    }
    setLoadingSummary(prev => ({ ...prev, [conversation.id]: true }));
    try {
      const conversationText = formatConversationForAI(conversation.messages);
      const result = await summarizeConversation({ conversationHistory: conversationText });
      if (result.summary) {
        setSummaries(prev => ({ ...prev, [conversation.id]: result.summary }));
        // Optionally, save summary back to conversation object in localStorage
        // This would require updating chat-storage.ts
      } else {
        toast({ title: "Summary Error", description: "Could not generate summary.", variant: "destructive" });
      }
    } catch (e) {
      console.error("Failed to generate summary:", e);
      toast({ title: "Summary Error", description: "An error occurred while generating summary.", variant: "destructive" });
    } finally {
      setLoadingSummary(prev => ({ ...prev, [conversation.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center">
            <LibraryBig className="mr-3 h-10 w-10" /> Your Learning Library
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Review your past study sessions and AI interactions. ({conversations.length} sessions)
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader>
             <div className="mx-auto bg-accent/20 rounded-full p-3 w-fit">
                <MessageSquareText className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="mt-4 text-2xl">Your Library is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You haven't had any study sessions yet. <br/>
              Start a new session from your dashboard or use the AI tutor.
            </p>
          </CardContent>
           <CardFooter className="justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/general-tutor">Try General Tutor</Link>
             </Button>
          </CardFooter>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {conversations.map((convo) => (
            <AccordionItem value={convo.id} key={convo.id} className="bg-card border rounded-lg shadow-md">
              <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-left">
                  <div className="flex-grow mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold text-primary">{convo.topic}</h3>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <CalendarDays className="mr-1.5 h-3 w-3" />
                      Last activity: {timeAgo[convo.id] || 'Calculating...'}
                       <span className="mx-1.5">·</span> 
                       {convo.messages.length} messages
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                    <Link href={
                        convo.topic === "Homework Help" ? "/homework-assistant" :
                        convo.topic === "General AI Tutor" ? "/general-tutor" :
                        `/study-session/${encodeURIComponent(convo.topic)}`
                    }>
                      Revisit Session
                    </Link>
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <div className="text-sm text-muted-foreground mb-4 max-h-60 overflow-y-auto border p-3 rounded-md bg-background">
                  {convo.messages.slice(0, 5).map(msg => ( // Show first 5 messages as preview
                    <p key={msg.id} className="truncate mb-1">
                      <span className={`font-semibold ${msg.sender === 'user' ? 'text-accent' : 'text-primary'}`}>
                        {msg.sender === 'user' ? 'You: ' : 'AI: '}
                      </span>
                      {msg.text}
                    </p>
                  ))}
                  {convo.messages.length > 5 && <p className="italic">...and {convo.messages.length - 5} more messages.</p>}
                </div>
                {summaries[convo.id] ? (
                  <div className="mt-2 p-3 border border-dashed rounded-md bg-primary/5">
                    <h4 className="font-semibold text-primary flex items-center"><FileText className="h-4 w-4 mr-2"/>AI Summary:</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{summaries[convo.id]}</p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleGenerateSummary(convo)} 
                    disabled={loadingSummary[convo.id]}
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                  >
                    {loadingSummary[convo.id] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                       <FileText className="mr-2 h-4 w-4" />
                    )}
                    Generate Summary
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}