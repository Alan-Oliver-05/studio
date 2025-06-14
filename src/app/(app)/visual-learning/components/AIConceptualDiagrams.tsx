
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Search, 
  Download, 
  Zap, 
  Eye, 
  EyeOff, 
  RotateCcw as ResetIcon,
  Lightbulb,
  Loader2,
  AlertTriangle,
  Image as ImageIconLucide
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Message as MessageType } from '@/types';
import { addMessageToConversation } from '@/lib/chat-storage';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { generateImageFromPrompt } from '@/ai/flows/generate-image-from-prompt';
import Image from "next/image"; // Next.js Image component
import { useToast } from '@/hooks/use-toast';

interface AIConceptualDiagramsProps {
  userProfile: UserProfile | null;
  conversationId: string | null;
}

const AIConceptualDiagrams: React.FC<AIConceptualDiagramsProps> = ({ userProfile, conversationId }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [generatedDiagramImageUri, setGeneratedDiagramImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateDiagram = async () => {
    if (!query.trim() || !userProfile || !conversationId) {
        if (!userProfile || !conversationId) {
            toast({title: "Error", description: "User profile or session ID is missing.", variant: "destructive"});
        }
        return;
    }
    setIsGenerating(true);
    setError(null);
    setAiResponseText(null);
    setGeneratedDiagramImageUri(null);
    
    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      sender: "user",
      text: `User wants a conceptual diagram for: "${query}"`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", userMessage, userProfile);

    try {
      const aiStudySessionInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "Visual Learning - Conceptual Diagrams",
        question: query,
      };
      
      const studySessionResult = await aiGuidedStudySession(aiStudySessionInput);

      if (studySessionResult && studySessionResult.response) {
        setAiResponseText(studySessionResult.response);
        let aiMessageText = studySessionResult.response;

        if (studySessionResult.visualElement && studySessionResult.visualElement.type === 'image_generation_prompt' && typeof studySessionResult.visualElement.content === 'string') {
          const imagePrompt = studySessionResult.visualElement.content;
          aiMessageText += `\n\n(AI is now attempting to generate an image based on the prompt: "${imagePrompt.substring(0,100)}...")`;
          
          // Log AI's textual plan before attempting image generation
          const preliminaryAiMessage: MessageType = {
            id: crypto.randomUUID(), sender: "ai", text: aiMessageText, timestamp: Date.now(),
            visualElement: studySessionResult.visualElement // Keep the prompt info
          };
          addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", preliminaryAiMessage, userProfile);
          
          try {
            const imageResult = await generateImageFromPrompt({ prompt: imagePrompt });
            if (imageResult.imageDataUri) {
              setGeneratedDiagramImageUri(imageResult.imageDataUri);
              toast({ title: "Diagram Generated", description: "The conceptual diagram image has been created." });
              // Update the existing AI message or add a new one with the image URI
               const imageAiMessage: MessageType = {
                  id: crypto.randomUUID(), sender: "ai", 
                  text: `Here's the generated diagram for "${query}". Description: ${studySessionResult.response}`,
                  timestamp: Date.now(),
                  generatedImageUri: imageResult.imageDataUri, // Store the generated image
                  visualElement: studySessionResult.visualElement // Keep original prompt
              };
              addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", imageAiMessage, userProfile);
              setAiResponseText(prev => `${prev}\n\nImage successfully generated.`);

            } else {
              throw new Error("Image generation succeeded but no image data was returned.");
            }
          } catch (imgError) {
            console.error("Image generation error:", imgError);
            const imgErrorMsg = imgError instanceof Error ? imgError.message : "Unknown image generation error.";
            setError(`Failed to generate diagram image: ${imgErrorMsg}`);
            toast({ title: "Image Generation Failed", description: imgErrorMsg, variant: "destructive" });
             const errorAiMessage: MessageType = {
                id: crypto.randomUUID(), sender: "ai", 
                text: `I described the diagram as: "${studySessionResult.response}" but encountered an error generating the image: ${imgErrorMsg}`, 
                timestamp: Date.now()
            };
            addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", errorAiMessage, userProfile);
          }
        } else {
          // AI responded but didn't provide an image prompt
          setAiResponseText(studySessionResult.response);
           const aiMessageNoVisual: MessageType = {
            id: crypto.randomUUID(), sender: "ai", text: studySessionResult.response, timestamp: Date.now(),
            suggestions: studySessionResult.suggestions
          };
          addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", aiMessageNoVisual, userProfile);
          setError("AI provided a description but not a visual generation prompt.");
          toast({ title: "Visual Not Generated", description: "AI provided a text response, but no image prompt for the diagram.", variant: "default" });
        }
      } else {
        throw new Error("AI did not provide a valid response for the diagram concept.");
      }
    } catch (e) {
      console.error("Error generating diagram:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to process diagram request: ${errorMessage}`);
      toast({ title: "Diagram Generation Error", description: errorMessage, variant: "destructive" });
      const errorSystemMessage: MessageType = {
        id: crypto.randomUUID(), sender: "ai", text: `Error processing diagram request: ${errorMessage}`, timestamp: Date.now()
      };
      addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", errorSystemMessage, userProfile);
    } finally {
      setIsGenerating(false);
    }
  };

  const exampleQueries = [
    "Diagram photosynthesis", 
    "Heart circulation system",
    "Basic atomic structure",
    "The water cycle explained",
    "Flowchart for a simple login process"
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      <TooltipProvider>
      <div className="bg-card border-b border-border shadow-sm p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 mb-2 sm:mb-0">
            <Brain className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-base font-bold text-foreground">AI Conceptual Diagrams</h1>
              <p className="text-xs text-muted-foreground">Generate educational diagrams with AI</p>
            </div>
          </div>
          {/* Removed Show Labels and Download SVG buttons */}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="relative flex-grow w-full sm:w-auto">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { handleGenerateDiagram(); } }}
              placeholder="E.g., 'Diagram photosynthesis process'"
              className="w-full pl-3 pr-8 py-1.5 text-sm h-9 rounded-md border-input focus-visible:ring-purple-500 bg-background" 
            />
             <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Button
            onClick={handleGenerateDiagram}
            disabled={isGenerating || !query.trim()}
            className="w-full sm:w-auto text-white rounded-md h-9 px-4 text-xs hover:bg-purple-700 bg-purple-600" 
            style={{backgroundColor: 'hsl(var(--chart-3))'}}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate Diagram
          </Button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1">
          {exampleQueries.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="xs" 
              onClick={() => {setQuery(example);}} // Removed direct call to handleGenerateDiagram
              className="text-xs px-2.5 py-0.5 h-auto rounded-full border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
      </TooltipProvider>

      <div className="flex-grow overflow-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-semibold">AI is crafting your diagram...</p>
            <p className="text-xs text-muted-foreground">This may take a few moments.</p>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-md text-sm">
            <AlertTriangle className="inline h-4 w-4 mr-2" />
            <strong>Error:</strong> {error}
          </div>
        )}

        {aiResponseText && !isGenerating && (
          <div className="bg-muted/50 p-3 rounded-md border">
            <h3 className="font-semibold text-sm text-primary mb-1">AI Diagram Plan:</h3>
            <p className="text-xs whitespace-pre-wrap">{aiResponseText}</p>
          </div>
        )}

        {generatedDiagramImageUri && !isGenerating && (
          <div className="mt-4 border rounded-lg shadow-md overflow-hidden bg-card">
            <Image
              src={generatedDiagramImageUri}
              alt={query || "Generated Conceptual Diagram"}
              width={800} 
              height={600} 
              className="object-contain w-full h-auto max-h-[70vh]"
              data-ai-hint="diagram illustration educational"
            />
            <p className="text-xs text-center p-2 text-muted-foreground bg-muted/30">Generated diagram for: "{query}"</p>
          </div>
        )}

        {!isGenerating && !aiResponseText && !generatedDiagramImageUri && !error && (
            <div className="text-center text-muted-foreground py-10">
                <ImageIconLucide className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-sm">Enter a concept or process above to generate a diagram.</p>
                <p className="text-xs mt-1">For example, "Water Cycle" or "How a Car Engine Works".</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIConceptualDiagrams;
