
"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import type { UserProfile, Message as MessageType, VisualElement, QAS_Stage, InteractiveQAndAInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, Bot, User, Loader2, Info, ImagePlus, Paperclip, XCircle, BarChart2, Zap, ImageIcon, Sparkles, BarChartBig, Link as LinkIcon, Check, AlertCircleIcon, ChevronRightSquare, Milestone, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiGuidedStudySession, AIGuidedStudySessionInput } from "@/ai/flows/ai-guided-study-session";
import { interactiveQAndA } from "@/ai/flows/interactive-q-and-a";
import { generateImageFromPrompt } from "@/ai/flows/generate-image-from-prompt";
import { addMessageToConversation, getConversationById, saveConversation, formatConversationForAI } from "@/lib/chat-storage";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import dynamic from "next/dynamic";

const AIMindMapDisplay = dynamic(
  () => import('@/app/(app)/visual-learning/components/AIMindMapDisplay').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading Interactive Canvas...</div>
  }
);


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
  initialInputQuery?: string;
  onInitialQueryConsumed?: () => void;
  enableImageUpload?: boolean;
  initialQAStage?: QAS_Stage; 
  initialQuestionsInStage?: number; 
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
    <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-md max-h-40 overflow-auto scrollbar-thin">
      {contentRepresentation}
    </pre>
  );
};

const RenderBarChartVisual = ({ visualElement }: { visualElement: VisualElement }) => {
  if (!visualElement || visualElement.type !== 'bar_chart_data' || !Array.isArray(visualElement.content) || visualElement.content.length === 0) {
    return <p className="text-xs text-muted-foreground p-2">Invalid or empty chart data provided by AI.</p>;
  }

  const chartData = visualElement.content as Array<{ name: string | number; [key: string]: any }>;

  let valueKey = "value";
  const firstItemKeys = Object.keys(chartData[0]);
  const potentialValueKeys = firstItemKeys.filter(k => k !== 'name' && typeof chartData[0][k] === 'number');
  if (potentialValueKeys.length > 0) {
      valueKey = potentialValueKeys[0];
  } else {
    const stringValueKey = firstItemKeys.find(k => k !== 'name');
    if (stringValueKey) valueKey = stringValueKey;
  }

  const chartConfig: ChartConfig = {};
  chartData.forEach((item, index) => {
    chartConfig[String(item.name)] = {
      label: String(item.name),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });
  chartConfig[valueKey] = { label: visualElement.caption || valueKey.charAt(0).toUpperCase() + valueKey.slice(1), color: "hsl(var(--primary))" };


  return (
    <div className="h-[250px] w-full mt-2 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval={0}
            angle={chartData.length > 5 ? -30 : 0}
            textAnchor={chartData.length > 5 ? "end" : "middle"}
            height={chartData.length > 5 ? 50 : 30}
            tickFormatter={(value) => String(value).length > 15 ? String(value).slice(0,12) + '...' : String(value)}
            style={{ fontSize: '10px', fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={5} style={{ fontSize: '10px', fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false}/>
          <RechartsTooltip
            cursor={{fill: "hsl(var(--muted))"}}
            contentStyle={{background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)"}}
            labelStyle={{color: "hsl(var(--foreground))", fontWeight: "bold"}}
            itemStyle={{color: "hsl(var(--foreground))"}}
          />
          <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig[String(entry.name)]?.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const SPECIAL_MODES_FOR_AI_GUIDED_STUDY = [
    "AI Learning Assistant Chat", 
    "Homework Help", 
    "LanguageTranslatorMode", 
    "Language Text Translation", 
    "Language Voice Translation", 
    "Language Conversation Practice", 
    "Language Camera Translation",
    "Visual Learning - Graphs & Charts",
    "Visual Learning - Conceptual Diagrams",
    "Visual Learning - Mind Maps", 
];

function findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }
  return -1;
}


export function ChatInterface({
  userProfile,
  topic, 
  conversationId,
  initialSystemMessage,
  placeholderText = "Type your message here...",
  context,
  initialInputQuery,
  onInitialQueryConsumed,
  enableImageUpload = true, 
  initialQAStage = 'initial_material', 
  initialQuestionsInStage = 0, 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [generatingImageForMessageId, setGeneratingImageForMessageId] = useState<string | null>(null);
  
  const isInteractiveQAMode = !SPECIAL_MODES_FOR_AI_GUIDED_STUDY.includes(topic);

  const [questionsAnsweredInClientStage, setQuestionsAnsweredInClientStage] = useState<number>(initialQuestionsInStage);
  const [currentClientStage, setCurrentClientStage] = useState<QAS_Stage>(initialQAStage);
  const [isTopicSessionCompleted, setIsTopicSessionCompleted] = useState<boolean>(false);


  useEffect(() => {
    const existingConversation = getConversationById(conversationId);
    if (existingConversation && existingConversation.messages.length > 0) {
      setMessages(existingConversation.messages);
      if (isInteractiveQAMode) {
        const lastAiMsg = [...existingConversation.messages].reverse().find(m => m.sender === 'ai');
        if (lastAiMsg?.aiNextStage) {
          const restoredStage = lastAiMsg.aiNextStage;
          setCurrentClientStage(restoredStage);
          
          let answeredCount = 0;
          const lastUserMsgIndex = findLastIndex(existingConversation.messages, m => m.sender === 'user');
          const lastAIMsgIndex = findLastIndex(existingConversation.messages, m => m.sender === 'ai');

          if (lastAIMsgIndex > -1 && lastAIMsgIndex > lastUserMsgIndex && lastAiMsg.aiIsStageComplete) {
             answeredCount = 0;
          } else {
            let aiQuestionForStagePending: MessageType | null = null;
            for (const msg of existingConversation.messages) {
                if (msg.sender === 'ai' && msg.aiNextStage === restoredStage && !msg.aiIsStageComplete) {
                    aiQuestionForStagePending = msg;
                } else if (msg.sender === 'user' && aiQuestionForStagePending && msg.timestamp > aiQuestionForStagePending.timestamp) {
                    const aiMsgIndex = existingConversation.messages.indexOf(aiQuestionForStagePending);
                    const userMsgIndex = existingConversation.messages.indexOf(msg);
                    if (userMsgIndex > aiMsgIndex) { 
                         answeredCount++;
                    }
                    aiQuestionForStagePending = null; 
                }
            }
          }
          setQuestionsAnsweredInClientStage(answeredCount);

          if (restoredStage === 'completed' && lastAiMsg.aiIsStageComplete) {
            setIsTopicSessionCompleted(true);
          } else {
            setIsTopicSessionCompleted(false);
          }
        } else { 
          setCurrentClientStage(initialQAStage);
          setQuestionsAnsweredInClientStage(initialQuestionsInStage);
          setIsTopicSessionCompleted(false);
        }
      }
    } else if (initialSystemMessage && !isInteractiveQAMode && topic !== "Visual Learning - Mind Maps") { 
      const firstAIMessage: MessageType = {
        id: crypto.randomUUID(), sender: "ai", text: initialSystemMessage, timestamp: Date.now(),
      };
      setMessages([firstAIMessage]);
      addMessageToConversation(conversationId, topic, firstAIMessage, userProfile || undefined, context?.subject, context?.lesson);
    } else if (initialSystemMessage && topic === "Visual Learning - Mind Maps") { 
        const firstAIMessage: MessageType = {
          id: crypto.randomUUID(), sender: "ai", text: initialSystemMessage, timestamp: Date.now(),
          visualElement: {
              type: 'interactive_mind_map_canvas',
              content: { initialTopic: initialInputQuery || "My Mind Map" }, 
              caption: `Interactive Mind Map for ${initialInputQuery || "My Mind Map"}`
          }
        };
        setMessages([firstAIMessage]);
        addMessageToConversation(conversationId, topic, firstAIMessage, userProfile || undefined, context?.subject, context?.lesson);
    }
     else { 
        setMessages([]);
        if (isInteractiveQAMode) {
            setCurrentClientStage(initialQAStage);
            setQuestionsAnsweredInClientStage(initialQuestionsInStage);
            setIsTopicSessionCompleted(false);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, initialSystemMessage, topic, userProfile, context, isInteractiveQAMode, initialQAStage, initialQuestionsInStage, initialInputQuery]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (initialInputQuery && initialInputQuery.trim() !== "" && topic !== "Visual Learning - Mind Maps") { 
      setInput(initialInputQuery);
      if (onInitialQueryConsumed) onInitialQueryConsumed();
    }
  }, [initialInputQuery, onInitialQueryConsumed, topic]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!enableImageUpload) return;
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
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
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateImage = async (messageId: string, promptText: string) => {
    if (!promptText || promptText.trim() === "") {
        toast({ title: "Cannot Generate Image", description: "The prompt for image generation is empty.", variant: "destructive" });
        return;
    }
    setGeneratingImageForMessageId(messageId);
    try {
      const result = await generateImageFromPrompt({ prompt: promptText });
      if (result.imageDataUri) {
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, generatedImageUri: result.imageDataUri } : msg
          );
          const convo = getConversationById(conversationId);
          if (convo) {
            convo.messages = updatedMessages;
            saveConversation(convo);
          }
          return updatedMessages;
        });
        toast({ title: "Image Generated", description: "The visual has been generated successfully." });
      } else {
        throw new Error("Image data URI was empty.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate the image. The AI may have safety filters or encountered an issue.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImageForMessageId(null);
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((!input.trim() && !uploadedImage) || isLoading || !userProfile) return;

    const lastAiMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const isLastAiMessageAnMCQ = lastAiMessage?.sender === 'ai' && (lastAiMessage.text.match(/\b([A-D])\)\s/i) || lastAiMessage.text.match(/\b[A-D]\.\s/i));

    if (isInteractiveQAMode && isTopicSessionCompleted && !isLastAiMessageAnMCQ) {
        toast({ title: "Topic Q&A Completed", description: `You've finished the Q&A for ${topic}. Please go back to select a new topic or start a new session.`, duration: 7000, variant: "default" });
        setInput(""); 
        return;
    }

    let userMessageText = input.trim();
    if (uploadedImage && uploadedImageName && enableImageUpload) {
       userMessageText = userMessageText ? `${userMessageText} (Context from uploaded image: ${uploadedImageName})` : `(Context from uploaded image: ${uploadedImageName})`;
    }

    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
      attachmentPreview: enableImageUpload ? uploadedImage : null,
    };
    
    const currentMessagesWithUser = [...messages, userMessage];
    setMessages(currentMessagesWithUser);
    addMessageToConversation(
        conversationId, topic, userMessage, userProfile, context?.subject, context?.lesson
    );

    const imageToSendAsPhotoDataUri = enableImageUpload ? uploadedImage : null;
    setInput("");
    setUploadedImage(null);
    setUploadedImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      let aiResponseMessage: MessageType;
      
      let aiFlowTopic: string = topic; 

      if (isInteractiveQAMode) {
        let previousAIQuestionText: string | undefined;
        const aiMessages = messages.filter(m => m.sender === 'ai');
        if (aiMessages.length > 0) {
            previousAIQuestionText = aiMessages[aiMessages.length - 1].text;
        }

        const qAndAInput: InteractiveQAndAInput = {
          studentProfile: { ...userProfile, age: Number(userProfile.age) },
          subject: context?.subject || topic, 
          lesson: context?.lesson || topic, 
          topic: aiFlowTopic, 
          studentAnswer: userMessage.text,
          previousQuestion: previousAIQuestionText,
          conversationHistory: formatConversationForAI(currentMessagesWithUser.slice(-6)), 
          currentStage: currentClientStage,
          questionsAskedInStage: questionsAnsweredInClientStage, 
        };
        const qAndAResponse = await interactiveQAndA(qAndAInput);
        
        aiResponseMessage = {
            id: crypto.randomUUID(), sender: "ai", text: qAndAResponse.question,
            feedback: qAndAResponse.feedback, isCorrect: qAndAResponse.isCorrect,
            suggestions: qAndAResponse.suggestions, timestamp: Date.now(),
            aiNextStage: qAndAResponse.nextStage, aiIsStageComplete: qAndAResponse.isStageComplete,
        };
        
        if (qAndAResponse.nextStage) {
            const prevStageForThisTurn = currentClientStage; 
            setCurrentClientStage(qAndAResponse.nextStage); 

            if (qAndAResponse.isStageComplete && qAndAResponse.nextStage !== prevStageForThisTurn && qAndAResponse.nextStage !== 'completed') {
                setQuestionsAnsweredInClientStage(0);
            } else if (qAndAResponse.nextStage === prevStageForThisTurn && !qAndAResponse.isStageComplete) {
                setQuestionsAnsweredInClientStage(prev => prev + 1);
            } else if (qAndAResponse.nextStage === prevStageForThisTurn && qAndAResponse.isStageComplete) {
                setQuestionsAnsweredInClientStage(prev => prev + 1);
            }
            
            if (qAndAResponse.nextStage === 'completed' && qAndAResponse.isStageComplete) {
                setIsTopicSessionCompleted(true);
                if (!qAndAResponse.question.match(/\b([A-D])\)\s/i) && !qAndAResponse.question.match(/\b[A-D]\.\s/i)) {
                     toast({ title: "Topic Q&A Completed!", description: `You've finished all stages for ${topic}. Great job!`, duration: 7000});
                }
            }
        }

      } else { 
        const aiInput: AIGuidedStudySessionInput = {
          studentProfile: { ...userProfile, age: Number(userProfile.age) },
          subject: context?.subject || undefined, lesson: context?.lesson || undefined,
          specificTopic: aiFlowTopic, 
          question: userMessage.text.replace(`(Context from uploaded image: ${uploadedImageName})`, '').trim(),
          photoDataUri: imageToSendAsPhotoDataUri || undefined,
        };
        const aiResponse = await aiGuidedStudySession(aiInput);
        if (!aiResponse || !aiResponse.response) throw new Error("AI response was empty or invalid.");
        aiResponseMessage = {
            id: crypto.randomUUID(), sender: "ai", text: aiResponse.response,
            suggestions: aiResponse.suggestions, visualElement: aiResponse.visualElement, timestamp: Date.now(),
        };
      }

      setMessages((prev) => [...prev, aiResponseMessage]);
      addMessageToConversation(
          conversationId, topic, aiResponseMessage, userProfile, context?.subject, context?.lesson
      );

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorText = error instanceof Error ? error.message : "Failed to get a response from AI. Please try again.";
      toast({ title: "AI Communication Error", description: errorText, variant: "destructive" });
      const errorMessageContent = error instanceof Error && error.message.includes("IMAGE_SIZE_LIMIT_EXCEEDED")
        ? "The uploaded image is too large for me to process. Please try a smaller one."
        : `I encountered an error: "${errorText}". Please try asking again or rephrasing.`;
      const errorMessage: MessageType = {
        id: crypto.randomUUID(), sender: "ai", text: errorMessageContent, timestamp: Date.now(),
      };
       setMessages((prev) => [...prev, errorMessage]);
       addMessageToConversation(
           conversationId, topic, errorMessage, userProfile, context?.subject, context?.lesson
        );
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">Please complete the onboarding process to use the chat features.</div>;
  }

  const getStageDisplayName = (stage: QAS_Stage): string => {
    switch(stage) {
        case 'initial_material': return 'Initial Material Review';
        case 'deeper_material': return 'Deeper Analysis';
        case 'out_of_syllabus': return 'Beyond the Syllabus';
        case 'completed': return 'Session Completed';
        default: return 'Q&A Session';
    }
  };
  
  const getTargetQuestionsForStage = (stage: QAS_Stage): number => {
    switch(stage) {
        case 'initial_material': return 3;
        case 'deeper_material': return 2;
        case 'out_of_syllabus': return 1;
        default: return 0; 
    }
  }

  const lastAiMessageIsMCQ = messages.length > 0 && 
                             messages[messages.length -1].sender === 'ai' &&
                             (messages[messages.length -1].text.match(/\b([A-D])\)\s/i) || messages[messages.length -1].text.match(/\b[A-D]\.\s/i));

  const isInputDisabled = isLoading || (isInteractiveQAMode && isTopicSessionCompleted && !lastAiMessageIsMCQ);


  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-xl border border-border/50">
      {isInteractiveQAMode && currentClientStage !== 'completed' && (
        <div className={cn(
            "text-xs text-center p-2.5 border-b font-medium rounded-t-lg bg-muted/60 text-muted-foreground"
        )}>
            <span className="flex items-center justify-center">
                <Milestone className="h-4 w-4 mr-1.5"/>
                Stage: {getStageDisplayName(currentClientStage)} (Q: {questionsAnsweredInClientStage + 1} of {getTargetQuestionsForStage(currentClientStage)})
            </span>
        </div>
      )}
      {isInteractiveQAMode && currentClientStage === 'completed' && isTopicSessionCompleted && (
         <div className="text-xs text-center p-2.5 border-b font-medium rounded-t-lg bg-green-500/10 text-green-700 dark:text-green-400">
            <span className="flex items-center justify-center"><Check className="h-4 w-4 mr-1.5"/> Topic Q&A Completed!</span>
        </div>
      )}
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 border border-primary/30 shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-primary/10"><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm shadow-md",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none border border-border/70",
                  message.visualElement?.type === 'interactive_mind_map_canvas' ? 'w-full' : 'max-w-[80%] sm:max-w-[70%]'
                )}
              >
                {message.attachmentPreview && message.sender === 'user' && enableImageUpload && (
                  <div className="mb-2 p-1 bg-background/50 rounded-md">
                    <Image
                      src={message.attachmentPreview}
                      alt="Uploaded context"
                      width={200}
                      height={200}
                      className="rounded-md object-contain max-h-48"
                    />
                  </div>
                )}

                {message.sender === 'ai' && isInteractiveQAMode && (
                  <>
                    {message.isCorrect === false && message.feedback && ( 
                      <div className="flex items-center text-xs text-destructive mb-1.5 font-medium">
                        <AlertCircleIcon className="h-4 w-4 mr-1.5"/>
                        <span>Needs Review</span>
                      </div>
                    )}
                    {message.isCorrect === true && message.feedback && ( 
                      <div className="flex items-center text-xs text-green-600 dark:text-green-500 mb-1.5 font-medium">
                        <Check className="h-4 w-4 mr-1.5"/>
                        <span>Correct!</span>
                      </div>
                    )}
                    {message.feedback && (message.feedback.trim() !== "") && (
                      <div className={cn("mb-2 pb-2", message.text && (currentClientStage !== 'completed' || (currentClientStage === 'completed' && (message.text.match(/\b([A-D])\)\s/i) || message.text.match(/\b[A-D]\.\s/i)))) ? "border-b border-current/10" : "")}>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm opacity-90">{message.feedback}</p>
                      </div>
                    )}
                    {!(currentClientStage === 'completed' && isTopicSessionCompleted && message.text === message.feedback && !(message.text.match(/\b([A-D])\)\s/i) || message.text.match(/\b[A-D]\.\s/i)) ) && message.text && (
                         <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    )}
                  </>
                )}

                {!(message.sender === 'ai' && isInteractiveQAMode) && (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                )}

                {message.sender === "ai" && message.visualElement && message.visualElement.type !== 'interactive_mind_map_canvas' && (
                  <Card className="mt-3 bg-background/50 border-primary/20 shadow-sm">
                     <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-primary flex items-center">
                        {message.visualElement.type.includes('chart') && <BarChartBig className="h-4 w-4 mr-1.5"/>}
                        {message.visualElement.type.includes('flowchart') && <Zap className="h-4 w-4 mr-1.5"/>}
                        {message.visualElement.type.includes('image') && <ImageIcon className="h-4 w-4 mr-1.5"/>}
                        AI Suggested Visual
                      </CardTitle>
                      {message.visualElement.caption && (
                        <CardDescription className="text-xs">{message.visualElement.caption}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                       {message.visualElement.type === 'bar_chart_data' ? (
                          <RenderBarChartVisual visualElement={message.visualElement} />
                        ) : (
                          <>
                            <p className="text-xs mb-1">Type: <span className="font-medium">{message.visualElement.type.replace(/_/g, ' ')}</span></p>
                            {message.visualElement.type !== 'image_generation_prompt' && <p className="text-xs mb-1">Content Details:</p>}
                            {message.visualElement.type !== 'image_generation_prompt' && renderVisualElementContent(message.visualElement)}
                          </>
                        )}

                      {message.visualElement.type === 'image_generation_prompt' && (
                        <div className="mt-2">
                          <p className="text-xs italic text-muted-foreground mb-1">Prompt: "{message.visualElement.content}"</p>
                          {!message.generatedImageUri && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleGenerateImage(message.id, message.visualElement?.content as string)}
                              disabled={generatingImageForMessageId === message.id}
                            >
                              {generatingImageForMessageId === message.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Generate Image
                            </Button>
                          )}
                        </div>
                      )}
                      {message.generatedImageUri && (
                        <div className="mt-2 border rounded-md overflow-hidden shadow-inner bg-muted/30">
                          <Image
                            src={message.generatedImageUri}
                            alt={message.visualElement.caption || "Generated image"}
                            width={300}
                            height={300}
                            className="object-contain w-full h-auto max-h-72"
                            data-ai-hint="illustration diagram chart"
                          />
                        </div>
                      )}
                       {(message.visualElement.type.includes('flowchart') || message.visualElement.type.includes('line_chart')) && (
                        <p className="text-xs italic mt-2 text-muted-foreground">(Visual rendering for {message.visualElement.type.replace('_', ' ')} is currently illustrative. Image generation available for prompts.)</p>
                       )}
                    </CardContent>
                  </Card>
                )}
                 {message.sender === "ai" && message.visualElement?.type === 'interactive_mind_map_canvas' && (
                  <div className="mt-3 border rounded-md bg-muted/30">
                    <AIMindMapDisplay initialTopic={message.visualElement.content?.initialTopic || "My Ideas"} />
                  </div>
                )}

                {message.sender === "ai" && message.suggestions && message.suggestions.length > 0 && (
                   <div className="mt-3 pt-2.5 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1.5 text-muted-foreground flex items-center">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                        Further Study/Suggestions:
                      </p>
                      <ul className="space-y-1.5">
                        {message.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs">
                            <a
                              href={suggestion.startsWith('http') ? suggestion : `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline break-all hover:text-accent/80 transition-colors"
                            >
                              <ChevronRightSquare className="inline h-3 w-3 mr-1 opacity-70"/>{suggestion}
                            </a>
                          </li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>
              {message.sender === "user" && (
                 <Avatar className="h-8 w-8 border border-accent/30 shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-accent/10"><User className="h-5 w-5 text-accent" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8 border border-primary/30 shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-primary/10"><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                </Avatar>
                <div className={cn(
                    "rounded-xl px-4 py-3 text-sm shadow-md bg-muted text-foreground rounded-bl-none border",
                     topic === "Visual Learning - Mind Maps" ? 'w-full' : 'max-w-[70%]' // Apply full width if mind map
                    )}>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>
      {uploadedImage && uploadedImageName && enableImageUpload && (
         <div className="p-2 border-t bg-muted/50 flex items-center justify-between text-xs mx-3 mt-1 rounded-t-md">
          <div className="flex items-center gap-2 text-muted-foreground overflow-hidden">
            <Paperclip className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Attached: <span className="font-medium text-foreground">{uploadedImageName}</span></span>
             <Image src={uploadedImage} alt="Preview" width={24} height={24} className="rounded object-cover flex-shrink-0" />
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={removeUploadedImage} title="Remove image">
            <XCircle className="h-4 w-4 text-destructive hover:text-destructive/80" />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 sm:gap-3 border-t border-border/50 p-3 bg-background rounded-b-lg"
      >
        {enableImageUpload && (
          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}
                disabled={isInputDisabled} aria-label="Upload Image"
                className="flex-shrink-0 text-muted-foreground hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Upload Image (max 4MB)</p></TooltipContent>
          </Tooltip>
          </TooltipProvider>
        )}
        {enableImageUpload && (
          <Input
            type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"
            disabled={isInputDisabled}
          />
        )}
        <Input
          value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholderText}
          className="flex-grow text-sm h-10"
          disabled={isInputDisabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && (input.trim() || (enableImageUpload && uploadedImage))) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          aria-label="Chat input"
        />
         <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" 
              disabled={isInputDisabled || (!input.trim() && !(enableImageUpload && uploadedImage))} 
              aria-label="Send message" className="flex-shrink-0"
            >
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Send Message</p></TooltipContent>
        </Tooltip>
        </TooltipProvider>
      </form>
      <div className="px-3 pb-2 pt-1 text-center text-xs text-muted-foreground">
        <p>AI responses are for informational purposes and may sometimes be inaccurate. Always verify critical information.</p>
      </div>
    </div>
  );
}
    


    
