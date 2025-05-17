
"use client";

import { useEffect, useState } from "react";
import { getConversations, deleteConversation, updateConversationCustomTitle } from "@/lib/chat-storage";
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
} from "@/components/ui/alert-dialog";
import { Loader2, LibraryBig, AlertTriangle, MessageSquareText, CalendarDays, FileText, Layers, BookCopy, Languages, Brain, PenSquare, Edit3, Trash2, PieChartIcon } from "lucide-react"; // Added PieChartIcon
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


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
          let groupKey = getGroupNameForConvo(convo);

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
        
        const convoToUpdate = getConversationById(conversation.id); // Re-fetch to ensure we have the latest
        if (convoToUpdate) {
            convoToUpdate.summary = result.summary;
            saveConversation(convoToUpdate); // Use imported saveConversation
        }
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
    const newTitle = prompt("Enter new title for this conversation:", convo.customTitle || getConversationDisplayTitle(convo, getGroupNameForConvo(convo)));
    if (newTitle !== null) { 
      if (newTitle.trim() === "") {
        toast({ title: "Rename Error", description: "Title cannot be empty.", variant: "destructive"});
        return;
      }
      updateConversationCustomTitle(convo.id, newTitle.trim());
      loadConversations(); 
      toast({ title: "Conversation Renamed", description: `Successfully renamed to "${newTitle.trim()}".` });
    }
  };

  const handleDeleteClick = (convo: Conversation) => {
    setConversationToDelete(convo); 
  };

  const handleDeleteConfirmed = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete.id);
      setConversationToDelete(null); 
      loadConversations(); 
      toast({ title: "Conversation Deleted", description: `"${getConversationDisplayTitle(conversationToDelete, getGroupNameForConvo(conversationToDelete))}" has been deleted.`, variant: "destructive" });
    }
  };

  const getGroupNameForConvo = (convo: Conversation): string => {
    let groupKey = convo.subjectContext || convo.topic || "Uncategorized";
    if (groupKey === "AI Learning Assistant Chat") groupKey = "General AI Tutor";
    else if (groupKey === "LanguageLearningMode") groupKey = "Language Learning";
    else if (groupKey === "Homework Help") groupKey = "Homework Helper";
    else if (groupKey === "Visual Learning Focus" || groupKey === "Visual Learning") groupKey = "Visual Learning"; // Added for new page
    return groupKey;
  }


  if (isLoading || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-0 mt-0">
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
    let baseHref = "";
    const queryParams = new URLSearchParams();
    queryParams.append("sessionId", convo.id);

    if (convo.topic === "Homework Help") {
      baseHref = "/homework-assistant";
    } else if (convo.topic === "AI Learning Assistant Chat") {
      baseHref = "/general-tutor";
    } else if (convo.topic === "LanguageLearningMode") {
      baseHref = "/language-learning";
    } else if (convo.topic === "Visual Learning" || convo.topic === "Visual Learning Focus") { // Added for Visual Learning page
      baseHref = "/visual-learning";
    } else if (convo.subjectContext && convo.lessonContext && convo.topic) {
      baseHref = `/study-session/${encodeURIComponent(convo.subjectContext)}`;
      queryParams.append("lesson", encodeURIComponent(convo.lessonContext));
      queryParams.append("topic", encodeURIComponent(convo.topic));
    } else {
        baseHref = `/study-session/${encodeURIComponent(convo.subjectContext || convo.topic || 'general')}`;
    }
    return `${baseHref}?${queryParams.toString()}`;
  };
  
  const sortedGroupNames = Object.keys(groupedConversations).sort((a, b) => a.localeCompare(b));

  const getGroupIcon = (groupName: string) => {
    if (groupName === "General AI Tutor") return <Brain className="mr-2 h-5 w-5" />;
    if (groupName === "Homework Helper") return <PenSquare className="mr-2 h-5 w-5" />;
    if (groupName === "Language Learning") return <Languages className="mr-2 h-5 w-5" />;
    if (groupName === "Visual Learning") return <PieChartIcon className="mr-2 h-5 w-5" />; // Added for Visual Learning
    return <BookCopy className="mr-2 h-5 w-5" />;
  };

  const getConversationDisplayTitle = (convo: Conversation, groupName: string) => {
    if (convo.customTitle) return convo.customTitle;
    
    if (convo.subjectContext && convo.lessonContext && convo.topic && convo.topic !== groupName) return convo.topic;
    
    if (convo.topic && convo.topic !== "AI Learning Assistant Chat" && convo.topic !== "LanguageLearningMode" && convo.topic !== "Homework Help" && convo.topic !== "Visual Learning" && convo.topic !== "Visual Learning Focus") return convo.topic;
    
    const dateSuffix = `(${new Date(convo.lastUpdatedAt).toLocaleDateString()})`;
    if (groupName === "General AI Tutor") return `General Chat ${dateSuffix}`;
    if (groupName === "Language Learning") return `Language Practice ${dateSuffix}`;
    if (groupName === "Homework Helper") return `Homework Session ${dateSuffix}`;
    if (groupName === "Visual Learning") return `Visual Session ${dateSuffix}`; // Added for Visual Learning
    if (convo.lessonContext) return `Lesson: ${convo.lessonContext}`;

    return convo.topic || 'General Discussion';
  };

  return (
    <div className="pb-8 pr-0 md:pr-2 pt-0 mt-0">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-0">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
            <LibraryBig className="mr-3 h-7 w-7 sm:h-8" /> Your Learning Library
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
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
              <AccordionItem value={groupName} key={groupName} className="bg-card border rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
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
                        <AccordionTrigger className="p-3 md:p-4 hover:no-underline hover:bg-accent/5 transition-colors text-left">
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
                               {(convo.subjectContext && convo.subjectContext === groupName && convo.lessonContext && convo.topic !== convo.lessonContext && !convo.customTitle && convo.topic !== "AI Learning Assistant Chat" && convo.topic !== "LanguageLearningMode" && convo.topic !== "Homework Help" && convo.topic !== "Visual Learning" && convo.topic !== "Visual Learning Focus") && (
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button asChild variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRenameConversation(convo);}}>
                                        <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLDivElement).click(); } }}>
                                           <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                        </div>
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Rename Conversation</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteClick(convo); }}>
                                      <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLDivElement).click(); } }}>
                                         <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                      </div>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Delete Conversation</p></TooltipContent>
                                </Tooltip>
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
                          {summaries[convo.id] || convo.summary ? (
                            <div className="mt-2 p-2 border border-dashed rounded-md bg-primary/5">
                              <h4 className="font-semibold text-primary text-xs flex items-center"><FileText className="h-3 w-3 mr-1.5"/>AI Summary:</h4>
                              <p className="text-xs text-foreground whitespace-pre-wrap">{summaries[convo.id] || convo.summary}</p>
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
      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the conversation
              {conversationToDelete ? ` titled "${getConversationDisplayTitle(conversationToDelete, getGroupNameForConvo(conversationToDelete!))}"` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper to get conversation from localStorage by ID (if needed outside this component, move to chat-storage)
function getConversationById(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(conv => conv.id === id) || null;
}

// Helper to save conversation (if needed outside this component, move to chat-storage)
function saveConversation(conversation: Conversation): void {
   if (typeof window === "undefined") return;
  const conversations = getConversations();
  const existingIndex = conversations.findIndex(c => c.id === conversation.id);
  if (existingIndex > -1) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation); 
  }
  try {
    localStorage.setItem("eduai-conversations", JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage", error);
  }
}
