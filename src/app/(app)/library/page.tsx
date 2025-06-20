
"use client";

import { useEffect, useState, useCallback } from "react";
import { getConversations, deleteConversation, updateConversationCustomTitle, getConversationById, saveConversation, formatConversationForAI } from "@/lib/chat-storage";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import type { Conversation, Message } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, LibraryBig, AlertTriangle, MessageSquareText, CalendarDays, FileText, Layers, BookCopy, Languages, Brain, PenSquare, Edit3, Trash2, PieChartIcon, Sparkles, ChevronDown, ChevronUp, Type as TypeIcon, Mic, MessagesSquare as MessagesSquareIcon, Camera as CameraIcon, Wand2, HelpCircle, BrainCircuit, VideoIcon } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";


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
  
  const [renamingConvoId, setRenamingConvoId] = useState<string | null>(null);
  const [currentRenameValue, setCurrentRenameValue] = useState<string>("");
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]); 
  
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);


  useEffect(() => {
    setIsClient(true); 
  }, []);

  const getModeFromTopic = (topic: string): string | undefined => {
    if (topic === "Language Text Translation") return "text";
    if (topic === "Language Voice Translation") return "voice";
    if (topic === "Language Conversation Practice") return "conversation";
    if (topic === "Language Camera Translation") return "camera";
    if (topic === "Visual Learning - Graphs & Charts") return "graphs";
    if (topic === "Visual Learning - Conceptual Diagrams") return "diagrams";
    if (topic === "Visual Learning - Mind Maps") return "mindmaps";

    if (topic === "Text Content Summarization") return "text";
    if (topic === "PDF Content Summarization & Q&A") return "pdf";
    if (topic === "Audio Content Summarization & Q&A") return "recording";
    if (topic === "Slide Content Summarization & Q&A") return "powerpoint";
    if (topic === "Video Content Summarization & Q&A") return "video";
    return undefined;
  }

  const getGroupNameForConvo = useCallback((convo: Conversation): string => {
    // Existing groups
    if (convo.topic === "AI Learning Assistant Chat") return "General AI Tutor";
    if (convo.topic === "Homework Help") return "Homework Helper";
    if (convo.topic?.startsWith("Visual Learning")) return "Visual Learning";
    if (convo.topic === "Language Text Translation") return "Text Translator";
    if (convo.topic === "Language Voice Translation") return "Voice Translator";
    if (convo.topic === "Language Conversation Practice") return "Conversation Translator";
    if (convo.topic === "Language Camera Translation") return "Camera Translator";
    if (convo.topic === "LanguageTranslatorMode") return "Language Translator (Legacy)"; 
    
    // New Summarizer Groups
    if (convo.topic === "Text Content Summarization") return "Text Summarizer";
    if (convo.topic === "PDF Content Summarization & Q&A") return "PDF Summarizer & Q&A";
    if (convo.topic === "Audio Content Summarization & Q&A") return "Audio Summarizer & Q&A";
    if (convo.topic === "Slide Content Summarization & Q&A") return "Slide Summarizer & Q&A";
    if (convo.topic === "Video Content Summarization & Q&A") return "Video Summarizer & Q&A";

    // New Flashcard/MCQ Groups
    if (convo.topic === "Flashcard Generation") return "Flashcard Generator";
    if (convo.topic === "MCQ Generation") return "MCQ Quiz Generator";
    
    return convo.subjectContext || convo.topic || "Uncategorized Study Session";
  }, []);

  const loadConversations = useCallback(() => {
    if (isClient) {
      setIsLoading(true);
      try {
        const convos = getConversations().sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt); 
        setAllConversations(convos);

        const groups: Record<string, Conversation[]> = {};
        convos.forEach(convo => {
          let groupKey = getGroupNameForConvo(convo);
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(convo);
        });
        setGroupedConversations(groups);
        
        const firstGroupKey = Object.keys(groups)[0];
        if (firstGroupKey && expandedGroups.length === 0 && convos.length > 0) {
            setExpandedGroups([firstGroupKey]);
        }
        setError(null);
      } catch (e) {
        console.error("Failed to load conversations:", e);
        setError("Failed to load conversation history.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [isClient, getGroupNameForConvo, expandedGroups.length]);

  useEffect(() => {
    loadConversations();
  }, [isClient, loadConversations]); 

  useEffect(() => {
    if (isClient && allConversations.length > 0) {
      const calculateTimes = () => {
        const updatedTimeAgo: Record<string, string> = {};
        allConversations.forEach(convo => {
          try {
            const lastUpdatedDate = new Date(convo.lastUpdatedAt);
            updatedTimeAgo[convo.id] = isNaN(lastUpdatedDate.getTime()) ? 'Invalid date' : formatDistanceToNow(lastUpdatedDate, { addSuffix: true });
          } catch (e) { updatedTimeAgo[convo.id] = 'Invalid date'; }
        });
        setTimeAgo(updatedTimeAgo);
      };
      calculateTimes(); 
      const intervalId = setInterval(calculateTimes, 60000); 
      return () => clearInterval(intervalId);
    }
  }, [allConversations, isClient]);

  const handleGenerateSummary = async (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length < 2) {
      toast({ title: "Cannot Summarize", description: "This conversation is too short to summarize.", variant: "destructive" });
      return;
    }
    setLoadingSummary(prev => ({ ...prev, [conversation.id]: true }));
    try {
      const conversationText = formatConversationForAI(conversation.messages);
      const result = await summarizeConversation({ conversationHistory: conversationText });
      if (result.summary) {
        setSummaries(prev => ({ ...prev, [conversation.id]: result.summary }));
        const convoToUpdate = getConversationById(conversation.id); 
        if (convoToUpdate) {
            convoToUpdate.summary = result.summary;
            saveConversation(convoToUpdate); 
        }
        toast({ title: "Summary Generated!", description: "The AI summary has been added to the conversation."});
      } else {
        toast({ title: "Summary Error", description: "AI could not generate a summary for this conversation.", variant: "destructive" });
      }
    } catch (e) {
      console.error("Failed to generate summary:", e);
      toast({ title: "Summary Error", description: "An error occurred while generating the summary.", variant: "destructive" });
    } finally {
      setLoadingSummary(prev => ({ ...prev, [conversation.id]: false }));
    }
  };

  const startRenameConversation = (convo: Conversation) => {
    setRenamingConvoId(convo.id);
    setCurrentRenameValue(convo.customTitle || getConversationDisplayTitle(convo, getGroupNameForConvo(convo)));
  };

  const handleRenameSubmit = (convoId: string) => {
    if (!currentRenameValue.trim()) {
        toast({ title: "Rename Error", description: "Title cannot be empty.", variant: "destructive"});
        return;
    }
    updateConversationCustomTitle(convoId, currentRenameValue.trim());
    setRenamingConvoId(null);
    loadConversations(); 
    toast({ title: "Conversation Renamed", description: `Successfully renamed to "${currentRenameValue.trim()}".` });
  };

  const handleDeleteClick = (convo: Conversation) => setConversationToDelete(convo);

  const handleDeleteConfirmed = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete.id);
      toast({ title: "Conversation Deleted", description: `"${getConversationDisplayTitle(conversationToDelete, getGroupNameForConvo(conversationToDelete!))}" has been deleted.`, variant: "default" });
      setSelectedConversationIds(prev => prev.filter(id => id !== conversationToDelete.id));
      setConversationToDelete(null); 
      loadConversations(); 
    }
  };

  const isConversationSelected = (convoId: string) => selectedConversationIds.includes(convoId);

  const isGroupFullySelected = (groupName: string): boolean => {
    const convosInGroup = groupedConversations[groupName];
    if (!convosInGroup || convosInGroup.length === 0) return false;
    return convosInGroup.every(convo => selectedConversationIds.includes(convo.id));
  };

  const areAllConversationsSelected = (): boolean => {
    if (allConversations.length === 0) return false;
    return selectedConversationIds.length === allConversations.length;
  };

  const handleToggleSelectConversation = (convoId: string) => {
    setSelectedConversationIds(prev =>
      prev.includes(convoId) ? prev.filter(id => id !== convoId) : [...prev, convoId]
    );
  };

  const handleToggleSelectGroup = (groupName: string) => {
    const convosInGroupIds = groupedConversations[groupName]?.map(c => c.id) || [];
    if (convosInGroupIds.length === 0) return;

    const allCurrentlySelectedInGroup = convosInGroupIds.every(id => selectedConversationIds.includes(id));

    if (allCurrentlySelectedInGroup) {
      setSelectedConversationIds(prev => prev.filter(id => !convosInGroupIds.includes(id)));
    } else {
      setSelectedConversationIds(prev => [...new Set([...prev, ...convosInGroupIds])]);
    }
  };
  
  const handleToggleSelectAll = () => {
    if (areAllConversationsSelected()) {
      setSelectedConversationIds([]);
    } else {
      setSelectedConversationIds(allConversations.map(c => c.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedConversationIds.length > 0) {
      setShowDeleteSelectedDialog(true);
    } else {
      toast({ title: "No Selection", description: "Please select conversations to delete.", variant: "default" });
    }
  };

  const confirmDeleteSelected = () => {
    selectedConversationIds.forEach(id => deleteConversation(id));
    toast({ title: `${selectedConversationIds.length} Conversation(s) Deleted`, description: "Selected conversations have been removed." });
    setSelectedConversationIds([]);
    setShowDeleteSelectedDialog(false);
    loadConversations();
  };
  
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
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-10 shadow-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Library</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getRevisitLink = (convo: Conversation) => {
    let baseHref = ""; 
    const queryParams = new URLSearchParams({ sessionId: convo.id });
    const modeFromTopic = getModeFromTopic(convo.topic);
    
    if (convo.topic?.startsWith("Language ")) {
        baseHref = "/language-learning";
        if (modeFromTopic) queryParams.set("mode", modeFromTopic);
    } else if (convo.topic?.startsWith("Visual Learning")) {
        baseHref = "/visual-learning";
        if (modeFromTopic) queryParams.set("mode", modeFromTopic);
    } else if (convo.topic === "Homework Help") {
        baseHref = "/homework-assistant";
    } else if (convo.topic === "AI Learning Assistant Chat") {
        baseHref = "/general-tutor";
    } else if (convo.topic?.startsWith("Text Content Sum") || 
               convo.topic?.startsWith("PDF Content Sum") || 
               convo.topic?.startsWith("Audio Content Sum") || 
               convo.topic?.startsWith("Slide Content Sum") ||
               convo.topic?.startsWith("Video Content Sum")) {
        baseHref = "/summarizer";
        if (modeFromTopic) queryParams.set("mode", modeFromTopic);
    } else if (convo.topic === "Flashcard Generation" || convo.topic === "MCQ Generation") {
        baseHref = "/flashcards";
    } else if (convo.subjectContext && convo.lessonContext && convo.topic) {
      baseHref = `/study-session/${encodeURIComponent(convo.subjectContext)}`;
    } else { 
        baseHref = `/study-session/${encodeURIComponent(convo.subjectContext || convo.topic || 'general')}`;
    }
    return `${baseHref}?${queryParams.toString()}`;
  };
  
  const sortedGroupNames = Object.keys(groupedConversations).sort((a, b) => {
    const priority = [
      "General AI Tutor", "Homework Helper", "Visual Learning", 
      "Text Translator", "Voice Translator", "Conversation Translator", "Camera Translator",
      "Text Summarizer", "PDF Summarizer & Q&A", "Audio Summarizer & Q&A", "Slide Summarizer & Q&A", "Video Summarizer & Q&A",
      "Flashcard Generator", "MCQ Quiz Generator"
    ];
    const indexA = priority.indexOf(a);
    const indexB = priority.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const getGroupIcon = (groupName: string) => {
    if (groupName === "General AI Tutor") return <Brain className="mr-2 h-5 w-5 text-blue-500" />;
    if (groupName === "Homework Helper") return <PenSquare className="mr-2 h-5 w-5 text-purple-500" />;
    if (groupName === "Visual Learning") return <PieChartIcon className="mr-2 h-5 w-5 text-orange-500" />;
    if (groupName === "Text Translator") return <TypeIcon className="mr-2 h-5 w-5 text-green-600" />;
    if (groupName === "Voice Translator") return <Mic className="mr-2 h-5 w-5 text-teal-500" />;
    if (groupName === "Conversation Translator") return <MessagesSquareIcon className="mr-2 h-5 w-5 text-indigo-500" />;
    if (groupName === "Camera Translator") return <CameraIcon className="mr-2 h-5 w-5 text-pink-500" />;
    if (groupName.includes("Translator")) return <Languages className="mr-2 h-5 w-5 text-green-500" />;

    if (groupName === "Text Summarizer") return <FileText className="mr-2 h-5 w-5 text-yellow-600" />;
    if (groupName === "PDF Summarizer & Q&A") return <FileText className="mr-2 h-5 w-5 text-red-500" />;
    if (groupName === "Audio Summarizer & Q&A") return <Mic className="mr-2 h-5 w-5 text-sky-500" />;
    if (groupName === "Slide Summarizer & Q&A") return <Layers className="mr-2 h-5 w-5 text-orange-600" />;
    if (groupName === "Video Summarizer & Q&A") return <VideoIcon className="mr-2 h-5 w-5 text-rose-500" />;
    if (groupName.includes("Summarizer")) return <Wand2 className="mr-2 h-5 w-5 text-gray-500" />;
    
    if (groupName === "Flashcard Generator") return <Sparkles className="mr-2 h-5 w-5 text-amber-500" />;
    if (groupName === "MCQ Quiz Generator") return <HelpCircle className="mr-2 h-5 w-5 text-cyan-500" />;

    return <BookCopy className="mr-2 h-5 w-5 text-gray-500" />;
  };

  const getConversationDisplayTitle = (convo: Conversation, groupName: string) => {
    if (convo.customTitle) return convo.customTitle;
    const firstUserMessage = convo.messages.find(m => m.sender === 'user')?.text.substring(0, 50);
    const dateSuffix = `(${new Date(convo.lastUpdatedAt).toLocaleDateString([], {month: 'short', day: 'numeric'})})`;
    
    if (groupName === "Text Translator") return `Text Session ${dateSuffix}`;
    if (groupName === "Voice Translator") return `Voice Session ${dateSuffix}`;
    if (groupName === "Conversation Translator") return `Conversation Practice ${dateSuffix}`;
    if (groupName === "Camera Translator") return `Camera Session ${dateSuffix}`;
    if (groupName === "General AI Tutor") return `General Chat ${dateSuffix}`;
    if (groupName === "Homework Helper") return `Homework Session ${dateSuffix}`;
    
    if (groupName === "Text Summarizer") return `Text Summary ${dateSuffix}`;
    if (groupName === "PDF Summarizer & Q&A") return `PDF Session ${dateSuffix}`;
    if (groupName === "Audio Summarizer & Q&A") return `Audio Session ${dateSuffix}`;
    if (groupName === "Slide Summarizer & Q&A") return `Slides Session ${dateSuffix}`;
    if (groupName === "Video Summarizer & Q&A") return `Video Session ${dateSuffix}`;
    if (groupName === "Flashcard Generator") return `Flashcards ${dateSuffix}`;
    if (groupName === "MCQ Quiz Generator") return `MCQ Quiz ${dateSuffix}`;

    if (groupName === "Visual Learning") {
        if (convo.topic === "Visual Learning - Mind Maps") return `Mind Map Session ${dateSuffix}`;
        if (convo.topic === "Visual Learning - Graphs & Charts") return `Graphs/Charts Session ${dateSuffix}`;
        if (convo.topic === "Visual Learning - Conceptual Diagrams") return `Diagram Session ${dateSuffix}`;
        return `Visual Session ${dateSuffix}`;
    }
    
    const nonContextualGroups = [
      "Text Translator", "Voice Translator", "Conversation Translator", "Camera Translator", 
      "General AI Tutor", "Homework Helper", "Visual Learning",
      "Text Summarizer", "PDF Summarizer & Q&A", "Audio Summarizer & Q&A", 
      "Slide Summarizer & Q&A", "Video Summarizer & Q&A",
      "Flashcard Generator", "MCQ Quiz Generator"
    ];

    if (firstUserMessage && !nonContextualGroups.includes(groupName)) {
      return `${firstUserMessage}... ${dateSuffix}`;
    }
    
    if (convo.topic && convo.topic !== groupName) return `${convo.topic} ${dateSuffix}`;
    return `${groupName} Session ${dateSuffix}`;
  };

  return (
    <div className="pb-8 pt-0">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-0">
        <div className="mb-4 sm:mb-0 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
            <LibraryBig className="mr-3 h-7 w-7 sm:h-8" /> My Learning Library
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Review and manage your past study sessions. ({allConversations.length} total session{allConversations.length === 1 ? '' : 's'})
          </p>
        </div>
         <div className="flex items-center gap-2 self-start sm:self-center mt-3 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-conversations"
                checked={areAllConversationsSelected()}
                onCheckedChange={handleToggleSelectAll}
                disabled={allConversations.length === 0}
                aria-label="Select all conversations"
              />
              <label htmlFor="select-all-conversations" className="text-sm font-medium text-muted-foreground">
                Select All ({selectedConversationIds.length})
              </label>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedConversationIds.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
      </div>

      {sortedGroupNames.length === 0 ? (
        <Card className="text-center py-10 shadow-lg max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardHeader className="pt-0">
             <div className="mx-auto bg-accent/10 rounded-full p-3 w-fit"> <MessageSquareText className="h-10 w-10 text-accent" /></div>
            <CardTitle className="mt-4 text-2xl">Your Library is Empty</CardTitle>
          </CardHeader>
          <CardContent><p className="text-muted-foreground">Start a new session to fill your library!</p></CardContent>
           <CardFooter className="justify-center gap-2">
            <Button asChild><Link href="/dashboard">Go to Dashboard</Link></Button>
            <Button asChild variant="outline"><Link href="/general-tutor">Try General Tutor</Link></Button>
          </CardFooter>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-3" value={expandedGroups} onValueChange={setExpandedGroups}>
          {sortedGroupNames.map((groupName) => {
            const convosInGroup = groupedConversations[groupName];
            if (!convosInGroup || convosInGroup.length === 0) return null;

            return (
              <AccordionItem value={groupName} key={groupName} className="bg-card border rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <AccordionTrigger className="p-4 md:p-5 hover:no-underline bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center flex-grow min-w-0">
                       <Checkbox
                          id={`select-group-${groupName}`}
                          checked={isGroupFullySelected(groupName)}
                          onCheckedChange={() => handleToggleSelectGroup(groupName)}
                          onClick={(e) => e.stopPropagation()} 
                          className="mr-3 flex-shrink-0 border-primary/50 data-[state=checked]:bg-primary/80"
                          aria-label={`Select all conversations in ${groupName}`}
                        />
                      <h2 className="text-md sm:text-lg font-semibold text-primary flex items-center truncate" title={groupName}>
                          {getGroupIcon(groupName)}
                          <span className="truncate">{groupName}</span>
                      </h2>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2">
                        <Badge variant="secondary" className="mr-2">{convosInGroup.length}</Badge>
                        {expandedGroups.includes(groupName) ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <ul className="divide-y divide-border">
                    {convosInGroup.map((convo) => (
                      <li key={convo.id} className="p-3 md:p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-start gap-3">
                           <Checkbox
                              id={`select-convo-${convo.id}`}
                              checked={isConversationSelected(convo.id)}
                              onCheckedChange={() => handleToggleSelectConversation(convo.id)}
                              aria-label={`Select conversation titled ${getConversationDisplayTitle(convo, groupName)}`}
                              className="mt-1 flex-shrink-0 border-primary/40 data-[state=checked]:bg-primary/70"
                            />
                          <div className="flex-grow min-w-0">
                            {renamingConvoId === convo.id ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={currentRenameValue} 
                                        onChange={(e) => setCurrentRenameValue(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(convo.id)}
                                        className="h-8 text-sm flex-grow"
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={() => handleRenameSubmit(convo.id)}>Save</Button>
                                    <Button size="sm" variant="outline" onClick={() => setRenamingConvoId(null)}>Cancel</Button>
                                </div>
                            ) : (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                              <div className="flex-grow mb-2 sm:mb-0 min-w-0">
                                <h3 className="text-sm md:text-base font-medium text-foreground truncate pr-2" title={getConversationDisplayTitle(convo, groupName)}>
                                  {getConversationDisplayTitle(convo, groupName)}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                    {convo.subjectContext && convo.subjectContext !== groupName && convo.subjectContext !== convo.topic && (
                                        <span className="flex items-center"><Layers className="mr-1 h-3 w-3"/>S: {convo.subjectContext}</span>
                                    )}
                                    {convo.lessonContext && convo.lessonContext !== convo.topic && convo.lessonContext !== groupName && (
                                        <span className="flex items-center"><BookCopy className="mr-1 h-3 w-3"/>L: {convo.lessonContext}</span>
                                    )}
                                    {convo.topic && 
                                     !convo.topic.startsWith("Language ") && 
                                     !convo.topic.startsWith("Visual Learning") &&
                                     !convo.topic.startsWith("Text Content Sum") &&
                                     !convo.topic.startsWith("PDF Content Sum") &&
                                     !convo.topic.startsWith("Audio Content Sum") &&
                                     !convo.topic.startsWith("Slide Content Sum") &&
                                     !convo.topic.startsWith("Video Content Sum") &&
                                     !convo.topic.startsWith("Flashcard Gen") &&
                                     !convo.topic.startsWith("MCQ Gen") &&
                                     !["AI Learning Assistant Chat", "Homework Help"].includes(convo.topic) &&
                                     convo.topic !== groupName && 
                                     convo.topic !== convo.subjectContext && 
                                     convo.topic !== convo.lessonContext && (
                                      <span className="flex items-center"><FileText className="mr-1 h-3 w-3"/>Topic: {convo.topic}</span>
                                    )}
                                    <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" />{timeAgo[convo.id] || 'Loading...'}</span>
                                    <span className="flex items-center"><MessageSquareText className="mr-1 h-3 w-3" />{convo.messages.length} msg</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 mt-2 sm:mt-0 self-start sm:self-center flex-shrink-0">
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRenameConversation(convo)}><Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" /></Button></TooltipTrigger><TooltipContent><p>Rename</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick(convo)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                                <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
                                  <Link href={getRevisitLink(convo)}>Revisit</Link>
                                </Button>
                              </div>
                            </div>
                            )}
                            {(summaries[convo.id] || convo.summary) ? (
                              <div className="mt-2 p-2.5 border border-dashed rounded-md bg-primary/5">
                                <h4 className="font-semibold text-primary text-xs flex items-center mb-1"><FileText className="h-3.5 w-3.5 mr-1.5"/>AI Summary:</h4>
                                <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-3">{summaries[convo.id] || convo.summary}</p>
                              </div>
                            ) : ( convo.messages && convo.messages.length >= 2 &&
                              <Button 
                                onClick={() => handleGenerateSummary(convo)} 
                                disabled={loadingSummary[convo.id]}
                                size="sm" variant="secondary" className="mt-2 text-xs h-7 px-2.5">
                                {loadingSummary[convo.id] ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                                Generate Summary
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
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

      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {selectedConversationIds.length} selected conversation(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSelected} className="bg-destructive hover:bg-destructive/90">
              Delete ({selectedConversationIds.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
    
