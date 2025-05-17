
"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import type { UserProfile, Message as MessageType, VisualElement } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, Bot, User, Loader2, Info, ImagePlus, Paperclip, XCircle, BarChart2, Zap, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiGuidedStudySession, AIGuidedStudySessionInput } from "@/ai/flows/ai-guided-study-session";
import { addMessageToConversation, getConversationById } from "@/lib/chat-storage";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatInterfaceProps {
  userProfile: UserProfile | null;
  topic: string; 
  conversationId: string; 
  initialSystemMessage?: string; 
  placeholderText?: string;
  context?: { 
    subject: string;
    lesson: string;
  };
}

const renderVisualElementContent = (visualElement: VisualElement) => {
  let contentRepresentation = "Visual content details are not available or type is not recognized.";
  if (visualElement.content) {
    if (typeof visualElement.content === 'string') {
      contentRepresentation = visualElement.content;
    } else if (Array.isArray(visualElement.content) || typeof visualElement.content === 'object') {
      try {
        contentRepresentation = JSON.stringify(visualElement.content, null, 2);
      } catch (e) {
        contentRepresentation = "Could not display structured content."
      }
    }
  }

  return (
    <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-md max-h-40 overflow-auto">
      {contentRepresentation}
    </pre>
  );
};


export function ChatInterface({
  userProfile,
  topic, 
  conversationId,
  initialSystemMessage,
  placeholderText = "Ask your question...",
  context, 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        topic, 
        firstAIMessage, 
        userProfile || undefined,
        context?.subject, 
        context?.lesson 
      );
    }
  }, [conversationId, initialSystemMessage, topic, userProfile, context]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((!input.trim() && !uploadedImage) || isLoading || !userProfile) return;

    let userMessageText = input.trim();
    if (uploadedImage && uploadedImageName) {
       userMessageText = userMessageText ? `${userMessageText} (See attached image: ${uploadedImageName})` : `(See attached image: ${uploadedImageName})`;
    }
    
    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
      attachmentPreview: uploadedImage, // For display in chat
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
    
    const imageToSend = uploadedImage; 
    setInput("");
    setUploadedImage(null); 
    setUploadedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        subject: context?.subject || undefined, 
        lesson: context?.lesson || undefined,   
        specificTopic: topic,    
        question: userMessage.text.replace(`(See attached image: ${uploadedImageName})`, '').trim(),
        photoDataUri: imageToSend ? imageToSend : undefined,
      };
      
      const aiResponse = await aiGuidedStudySession(aiInput);

      if (aiResponse && aiResponse.response) {
        const aiMessage: MessageType = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: aiResponse.response,
          suggestions: aiResponse.suggestions,
          visualElement: aiResponse.visualElement,
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
      const errorMessageText = error instanceof Error && error.message.includes("IMAGE_SIZE_LIMIT_EXCEEDED")
        ? "The uploaded image is too large for me to process. Please try a smaller one."
        : "I encountered an error. Please try asking again.";
      const errorMessage: MessageType = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: errorMessageText,
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
                <Avatar className="h-8 w-8 border border-primary/50 self-start">
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
                {message.attachmentPreview && message.sender === 'user' && (
                  <div className="mb-2">
                    <Image 
                      src={message.attachmentPreview} 
                      alt="Uploaded preview" 
                      width={200} 
                      height={200} 
                      className="rounded-md object-contain max-h-48" 
                    />
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                
                {message.sender === "ai" && message.visualElement && (
                  <Card className="mt-3 bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm font-semibold text-primary flex items-center">
                        {message.visualElement.type.includes('chart') && <BarChart2 className="h-4 w-4 mr-2"/>}
                        {message.visualElement.type.includes('flowchart') && <Zap className="h-4 w-4 mr-2"/>}
                        {message.visualElement.type.includes('image') && <ImageIcon className="h-4 w-4 mr-2"/>}
                        AI Suggested Visual
                      </CardTitle>
                      {message.visualElement.caption && (
                        <CardDescription className="text-xs">{message.visualElement.caption}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-xs mb-1">Type: <span className="font-medium">{message.visualElement.type.replace(/_/g, ' ')}</span></p>
                      <p className="text-xs mb-1">Content:</p>
                      {renderVisualElementContent(message.visualElement)}
                      <p className="text-xs italic mt-2 text-muted-foreground">(Visual rendering capabilities are under development)</p>
                    </CardContent>
                  </Card>
                )}

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
                 <Avatar className="h-8 w-8 border border-accent/50 self-start">
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
      {uploadedImage && uploadedImageName && (
        <div className="p-2 border-t bg-muted/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            Attached: <span className="font-medium text-foreground">{uploadedImageName}</span>
             <Image src={uploadedImage} alt="Preview" width={24} height={24} className="rounded object-cover" />
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeUploadedImage} title="Remove image">
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t p-3 bg-background rounded-b-lg"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Upload Image"
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload Image</p>
          </TooltipContent>
        </Tooltip>
        <Input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          disabled={isLoading}
        />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholderText}
          className="flex-grow text-sm"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
            }
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !uploadedImage)} aria-label="Send message">
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Message</p>
          </TooltipContent>
        </Tooltip>
      </form>
    </div>
  );
}

