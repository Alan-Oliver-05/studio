
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import type { UserProfile, Message as MessageType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, Bot, User, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiGuidedStudySession, AIGuidedStudySessionInput } from "@/ai/flows/ai-guided-study-session";
import { addMessageToConversation, getConversationById } from "@/lib/chat-storage";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface ChatInterfaceProps {
  userProfile: UserProfile | null;
  topic: string; // This will be the most specific topic (e.g., "Linear Equations", "General AI Tutor")
  conversationId: string; 
  initialSystemMessage?: string; 
  placeholderText?: string;
  context?: { // Optional broader context for specific study sessions
    subject: string;
    lesson: string;
  };
}

export function ChatInterface({
  userProfile,
  topic, // This is the specificTopic for the AI flow
  conversationId,
  initialSystemMessage,
  placeholderText = "Ask your question...",
  context, // Contains subject and lesson if applicable
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const existingConversation = getConversationById(conversationId);
    if (existingConversation) {
      setMessages(existingConversation.messages);
    } else if (initialSystemMessage) {
      const firstAIMessage: MessageType = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: initialSystemMessage,
        timestamp: Date.now(),
      };
      setMessages([firstAIMessage]);
      addMessageToConversation(
        conversationId, 
        topic, // Specific topic
        firstAIMessage, 
        userProfile || undefined,
        context?.subject, // Broader subject context
        context?.lesson // Broader lesson context
      );
    }
  }, [conversationId, initialSystemMessage, topic, userProfile, context]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !userProfile) return;

    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    addMessageToConversation(
        conversationId, 
        topic, 
        userMessage, 
        userProfile,
        context?.subject,
        context?.lesson
    );
    setInput("");
    setIsLoading(true);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: {
          name: userProfile.name,
          age: Number(userProfile.age),
          gender: userProfile.gender,
          country: userProfile.country,
          state: userProfile.state,
          preferredLanguage: userProfile.preferredLanguage,
          educationQualification: { 
            boardExam: userProfile.educationCategory === 'board' ? userProfile.educationQualification.boardExams : undefined,
            competitiveExam: userProfile.educationCategory === 'competitive' ? userProfile.educationQualification.competitiveExams : undefined,
            universityExam: userProfile.educationCategory === 'university' ? userProfile.educationQualification.universityExams : undefined,
          }
        },
        subject: context?.subject, // Will be undefined for General Tutor / Homework Assistant
        lesson: context?.lesson,   // Will be undefined for General Tutor / Homework Assistant
        specificTopic: topic,    // The 'topic' prop of ChatInterface becomes 'specificTopic'
        question: userMessage.text,
      };
      
      const aiResponse = await aiGuidedStudySession(aiInput);

      if (aiResponse && aiResponse.response) {
        const aiMessage: MessageType = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: aiResponse.response,
          suggestions: aiResponse.suggestions,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        addMessageToConversation(
            conversationId, 
            topic, 
            aiMessage, 
            userProfile,
            context?.subject,
            context?.lesson
        );
      } else {
        throw new Error("AI response was empty or invalid.");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from AI. Please try again.",
        variant: "destructive",
      });
      const errorMessage: MessageType = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "I encountered an error. Please try asking again.",
        timestamp: Date.now(),
      };
       setMessages((prev) => [...prev, errorMessage]);
       addMessageToConversation(
           conversationId, 
           topic, 
           errorMessage, 
           userProfile,
           context?.subject,
           context?.lesson
        );
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!userProfile) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Please complete onboarding to use the chat.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-xl border">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none border"
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.sender === "ai" && message.suggestions && message.suggestions.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-muted-foreground/20">
                      <p className="text-xs font-semibold mb-1 text-muted-foreground flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Further Reading:
                      </p>
                      <ul className="space-y-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs">
                            <a 
                              href={suggestion.startsWith('http') ? suggestion : `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-accent hover:underline break-all"
                            >
                              {suggestion}
                            </a>
                          </li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>
              {message.sender === "user" && (
                 <Avatar className="h-8 w-8 border border-accent/50">
                  <AvatarFallback><User className="h-5 w-5 text-accent" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-end gap-3 justify-start">
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md bg-muted text-foreground rounded-bl-none border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t p-4 bg-background rounded-b-lg"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholderText}
          className="flex-grow text-sm"
          disabled={isLoading}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </div>
  );
}

