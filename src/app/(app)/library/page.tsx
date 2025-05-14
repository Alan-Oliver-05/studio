
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
import { Loader2, LibraryBig, AlertTriangle, MessageSquareText, CalendarDays, FileText, Layers, BookCopy } from "lucide-react";
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
    if (isClient && conversations.length > 0) {
      const calculateTimes = () => {
        const updatedTimeAgo: Record<string, string> = {};
        conversations.forEach(convo => {
          try {
            updatedTimeAgo[convo.id] = formatDistanceToNow(new Date(convo.lastUpdatedAt), { addSuffix: true });
          } catch (e) {
            console.warn(`Could not format date for convo ${convo.id}:`, e);
            updatedTimeAgo[convo.id] = 'Invalid date';
          }
        });
        setTimeAgo(updatedTimeAgo);
      };
      
      calculateTimes(); 
      const intervalId = setInterval(calculateTimes, 60000); 
      return () => clearInterval(intervalId);
    }
  }, [conversations, isClient]);

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

  if (isLoading || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your library...</p>
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

  const getRevisitLink = (convo: Conversation) => {
    if (convo.topic === "Homework Help") return "/homework-assistant";
    if (convo.topic === "General AI Tutor" || convo.topic === "AI Learning Assistant Chat") return "/general-tutor";
    // For specific study sessions, reconstruct the path
    // The convo.topic is the specific topic, subjectContext is the broader subject
    return `/study-session/${encodeURIComponent(convo.subjectContext || convo.topic)}`;
  };

  return (
    <div className="pb-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center pt-0">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary flex items-center mt-0">
            <LibraryBig className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Your Learning Library
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-1 md:mt-2">
            Review your past study sessions. ({conversations.length} session{conversations.length === 1 ? '' : 's'})
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="text-center py-10 shadow-lg max-w-2xl mx-auto">
          <CardHeader>
             <div className="mx-auto bg-accent/10 rounded-full p-3 w-fit">
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
              <AccordionTrigger className="p-4 md:p-6 hover:no-underline">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-left">
                  <div className="flex-grow mb-2 sm:mb-0">
                    <h3 className="text-md md:text-lg font-semibold text-primary">{convo.topic}</h3>
                    {convo.subjectContext && convo.subjectContext !== convo.topic && (
                         <p className="text-xs text-muted-foreground flex items-center">
                            <Layers className="mr-1.5 h-3 w-3"/> Subject: {convo.subjectContext}
                            {convo.lessonContext && (<> <span className="mx-1">&gt;</span> <BookCopy className="mr-1.5 h-3 w-3"/> Lesson: {convo.lessonContext}</>)}
                         </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <CalendarDays className="mr-1.5 h-3 w-3" />
                      Last activity: {timeAgo[convo.id] || 'Loading...'}
                       <span className="mx-1.5">·</span> 
                       {convo.messages.length} message{convo.messages.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()} className="mt-2 sm:mt-0">
                     <Link href={getRevisitLink(convo)}>
                      Revisit Session
                    </Link>
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 md:p-6 pt-0">
                <div className="text-sm text-muted-foreground mb-4 max-h-60 overflow-y-auto border p-3 rounded-md bg-background">
                  {convo.messages.slice(0, 5).map(msg => (
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
                    disabled={loadingSummary[convo.id] || (convo.messages?.length || 0) < 2}
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    title={(convo.messages?.length || 0) < 2 ? "Conversation too short to summarize" : "Generate AI Summary"}
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
