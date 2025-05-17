
"use client";

import { useEffect, useState } from "react";
import { getConversations, formatConversationForAI, deleteConversation, updateConversationCustomTitle } from "@/lib/chat-storage";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, LibraryBig, AlertTriangle, MessageSquareText, CalendarDays, FileText, Layers, BookCopy, Languages, Brain, PenSquare, Edit3, Trash2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [groupedConversations, setGroupedConversations] = useState<Record<string, Conversation[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});
  const [timeAgo, setTimeAgo] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  useEffect(() => {
    setIsClient(true); 
  }, []);

  const loadConversations = () => {
    if (isClient) {
      setIsLoading(true);
      try {
        const convos = getConversations(); 
        setAllConversations(convos);

        const groups: Record<string, Conversation[]> = {};
        convos.forEach(convo => {
          let groupKey = convo.subjectContext || convo.topic || "Uncategorized";
          if (groupKey === "AI Learning Assistant Chat") groupKey = "General AI Tutor";
          if (groupKey === "LanguageLearningMode") groupKey = "Language Learning";
          if (groupKey === "Homework Help") groupKey = "Homework Helper";

          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(convo);
        });
        setGroupedConversations(groups);
        setError(null);
      } catch (e) {
        console.error("Failed to load conversations:", e);
        setError("Failed to load conversation history.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isClient]);

  useEffect(() => {
    if (isClient && allConversations.length > 0) {
      const calculateTimes = () => {
        const updatedTimeAgo: Record<string, string> = {};
        allConversations.forEach(convo => {
          try {
            const lastUpdatedDate = new Date(convo.lastUpdatedAt);
            if (!isNaN(lastUpdatedDate.getTime())) {
              updatedTimeAgo[convo.id] = formatDistanceToNow(lastUpdatedDate, { addSuffix: true });
            } else {
              updatedTimeAgo[convo.id] = 'Invalid date';
            }
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
  }, [allConversations, isClient]);

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

  const handleRenameConversation = (convo: Conversation) => {
    const newTitle = prompt("Enter new title for this conversation:", convo.customTitle || convo.topic);
    if (newTitle !== null) { // prompt returns null if cancelled
      if (newTitle.trim() === "") {
        toast({ title: "Rename Error", description: "Title cannot be empty.", variant: "destructive"});
        return;
      }
      updateConversationCustomTitle(convo.id, newTitle.trim());
      loadConversations(); // Reload to reflect changes
      toast({ title: "Conversation Renamed", description: `Successfully renamed to "${newTitle.trim()}".` });
    }
  };

  const handleDeleteConfirmed = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete.id);
      setConversationToDelete(null);
      loadConversations(); // Reload to reflect changes
      toast({ title: "Conversation Deleted", description: `"${conversationToDelete.customTitle || conversationToDelete.topic}" has been deleted.`, variant: "destructive" });
    }
  };


  if (isLoading || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your learning library...</p>
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
    // Check for general tutor by specific topic name first
    if (convo.topic === "AI Learning Assistant Chat") return "/general-tutor"; 
    if (convo.topic === "LanguageLearningMode") return "/language-learning";
    // Fallback to subject context for study sessions
    const subjectForLink = convo.subjectContext || convo.topic;
    return `/study-session/${encodeURIComponent(subjectForLink)}`;
  };
  
  const sortedGroupNames = Object.keys(groupedConversations).sort((a, b) => a.localeCompare(b));

  const getGroupIcon = (groupName: string) => {
    if (groupName === "General AI Tutor") return <Brain className="mr-2 h-5 w-5" />;
    if (groupName === "Homework Helper") return <PenSquare className="mr-2 h-5 w-5" />;
    if (groupName === "Language Learning") return <Languages className="mr-2 h-5 w-5" />;
    return <BookCopy className="mr-2 h-5 w-5" />;
  };

  const getConversationDisplayTitle = (convo: Conversation, groupName: string) => {
    if (convo.customTitle) return convo.customTitle;
    if (convo.topic !== groupName && convo.topic !== "LanguageLearningMode" && convo.topic !== "AI Learning Assistant Chat" && convo.topic !== "Homework Help") return convo.topic;
    if (convo.lessonContext) return `Lesson: ${convo.lessonContext}`;
    if (convo.topic === "LanguageLearningMode") return "Language Practice";
    return 'General Discussion';
  };

  return (
    <div className="pb-8 pr-4 md:pr-6 pt-0">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-0">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary flex items-center mt-0">
            <LibraryBig className="mr-3 h-8 w-8 md:h-10 md:w-10" /> Your Learning Library
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-1 md:mt-2">
            Review your past study sessions. ({allConversations.length} total session{allConversations.length === 1 ? '' : 's'})
          </p>
        </div>
      </div>

      {sortedGroupNames.length === 0 ? (
        <Card className="text-center py-10 shadow-lg max-w-2xl mx-auto">
          <CardHeader className="pt-0">
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
        <Accordion type="multiple" className="w-full space-y-4">
          {sortedGroupNames.map((groupName) => {
            const convosInGroup = groupedConversations[groupName];
            if (!convosInGroup || convosInGroup.length === 0) return null;

            return (
              <AccordionItem value={groupName} key={groupName} className="bg-card border rounded-lg shadow-md overflow-hidden">
                <AccordionTrigger className="p-4 md:p-5 hover:no-underline bg-muted/50 hover:bg-muted/80">
                  <div className="flex justify-between items-center w-full">
                    <h2 className="text-lg md:text-xl font-semibold text-primary flex items-center">
                        {getGroupIcon(groupName)}
                        {groupName}
                    </h2>
                    <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-md">
                      {convosInGroup.length} session{convosInGroup.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <Accordion type="single" collapsible className="w-full space-y-px bg-card"> 
                    {convosInGroup.map((convo, index) => (
                      <AccordionItem value={convo.id} key={convo.id} className={`border-t ${index === 0 ? 'border-t-0' : ''}`}>
                        <AccordionTrigger className="p-3 md:p-4 hover:no-underline text-left">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                            <div className="flex-grow mb-2 sm:mb-0">
                              <h3 className="text-sm md:text-base font-medium text-foreground">
                                {getConversationDisplayTitle(convo, groupName)}
                              </h3>
                              {convo.subjectContext && convo.subjectContext !== groupName && (
                                <p className="text-xs text-muted-foreground flex items-center">
                                    <Layers className="mr-1.5 h-3 w-3"/> Subject: {convo.subjectContext}
                                </p>
                              )}
                               {(convo.subjectContext && convo.subjectContext === groupName && convo.lessonContext && convo.topic !== convo.lessonContext && !convo.customTitle) && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <BookCopy className="mr-1.5 h-3 w-3"/> Lesson: {convo.lessonContext}
                                  </p>
                              )}
                              <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <CalendarDays className="mr-1.5 h-3 w-3" />
                                Last activity: {timeAgo[convo.id] || 'Loading...'}
                                <span className="mx-1.5">·</span> 
                                {convo.messages.length} message{convo.messages.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 mt-2 sm:mt-0 self-start sm:self-center">
                               <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRenameConversation(convo);}} title="Rename conversation">
                                <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} title="Delete conversation">
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the conversation titled &quot;{convo.customTitle || convo.topic}&quot;.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteConfirmed()}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                <Link href={getRevisitLink(convo)}>
                                  Revisit
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 md:p-4 pt-0">
                          <div className="text-xs text-muted-foreground mb-3 max-h-48 overflow-y-auto border p-2 rounded-md bg-background/50">
                            {convo.messages.slice(0, 5).map(msg => (
                              <p key={msg.id} className="truncate mb-0.5">
                                <span className={`font-semibold ${msg.sender === 'user' ? 'text-accent' : 'text-primary'}`}>
                                  {msg.sender === 'user' ? 'You: ' : 'AI: '}
                                </span>
                                {msg.text}
                              </p>
                            ))}
                            {convo.messages.length > 5 && <p className="italic">...and {convo.messages.length - 5} more messages.</p>}
                          </div>
                          {summaries[convo.id] ? (
                            <div className="mt-2 p-2 border border-dashed rounded-md bg-primary/5">
                              <h4 className="font-semibold text-primary text-xs flex items-center"><FileText className="h-3 w-3 mr-1.5"/>AI Summary:</h4>
                              <p className="text-xs text-foreground whitespace-pre-wrap">{summaries[convo.id]}</p>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => handleGenerateSummary(convo)} 
                              disabled={loadingSummary[convo.id] || (convo.messages?.length || 0) < 2}
                              size="sm"
                              variant="secondary"
                              className="mt-1 text-xs"
                              title={(convo.messages?.length || 0) < 2 ? "Conversation too short to summarize" : "Generate AI Summary"}
                            >
                              {loadingSummary[convo.id] ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <FileText className="mr-1.5 h-3 w-3" />
                              )}
                              Generate Summary
                            </Button>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
       {/* AlertDialog for delete confirmation - structure might need slight adjustment if it's meant to be a single dialog reused */}
       {/* It's better to have AlertDialogTrigger inside map, and DialogContent outside or manage state carefully if one dialog */}
    </div>
  );
}
    
