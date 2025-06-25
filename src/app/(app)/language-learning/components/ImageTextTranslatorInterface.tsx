
"use client";

import React, { useState, useRef, ChangeEvent, useMemo } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, Languages, Camera, Image as ImageIcon, FileText, ArrowRightLeft, Info, History, Star, ChevronDown, Check } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation } from '@/lib/chat-storage';
import { LANGUAGES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import NextImage from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';

interface ImageTextTranslatorInterfaceProps {
  userProfile: UserProfile;
  conversationId: string;
  topic: string;
}

const ImageTextTranslatorInterface: React.FC<ImageTextTranslatorInterfaceProps> = ({ userProfile, conversationId, topic }) => {
  const [targetLang, setTargetLang] = useState<string>(LANGUAGES.find(l=>l.label.toLowerCase() === userProfile.preferredLanguage.toLowerCase())?.value || 'en');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImageDataUri, setUploadedImageDataUri] = useState<string | null>(null);

  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");

  const filteredLanguages = useMemo(() =>
    LANGUAGES.filter(lang =>
      lang.label.toLowerCase().includes(languageSearch.toLowerCase())
    ),
  [languageSearch]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid File Type", description: "Please upload an image file (e.g., PNG, JPG).", variant: "destructive" });
        return;
      }
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ title: "Image too large", description: "Please upload an image smaller than 4MB.", variant: "destructive" });
        return;
      }
      setUploadedImageFile(file);
      setExtractedText(null);
      setTranslatedText(null);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImageDataUri(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTranslateImage = async () => {
    if (!uploadedImageDataUri || !userProfile || !conversationId) {
      toast({ title: "Missing Input", description: "Please upload an image to translate.", variant: "destructive"});
      if(!userProfile || !conversationId) console.error("User profile or convo ID missing for image translation");
      return;
    }
    setIsLoading(true);
    setError(null);
    setExtractedText(null);
    setTranslatedText(null);

    const targetLangLabel = LANGUAGES.find(l => l.value === targetLang)?.label || targetLang;
    const questionForAI = `Translate the text in this image to ${targetLangLabel}.`;

    const userMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user',
      text: `User requested to translate text from image "${uploadedImageFile?.name || 'uploaded_image'}" to ${targetLangLabel}.`,
      timestamp: Date.now(), attachmentPreview: uploadedImageDataUri
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "Language Camera Translation", 
        question: questionForAI,
        photoDataUri: uploadedImageDataUri,
      };

      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        const responseLines = result.response.split('\n');
        let currentExtracted = "";
        let currentTranslated = "";

        const extractedLine = responseLines.find(line => line.toLowerCase().startsWith("extracted text"));
        const translatedLine = responseLines.find(line => line.toLowerCase().startsWith("translated text"));

        if (extractedLine) {
            currentExtracted = extractedLine.substring(extractedLine.indexOf(':') + 1).trim();
        }
        if (translatedLine) {
            currentTranslated = translatedLine.substring(translatedLine.indexOf(':') + 1).trim();
        }
        
        if (!currentExtracted && !currentTranslated && result.response) {
            currentTranslated = result.response;
            currentExtracted = "AI could not separate extracted text clearly.";
        } else if (!currentTranslated && currentExtracted) {
            currentTranslated = "AI did not provide a translation for the extracted text.";
        } else if (!currentExtracted && currentTranslated) {
             currentExtracted = "AI provided translation but not the extracted text.";
        }


        setExtractedText(currentExtracted || "No text extracted or extraction failed.");
        setTranslatedText(currentTranslated || "Translation not available or failed.");

        const aiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: result.response,
          suggestions: result.suggestions, timestamp: Date.now(),
        };
        addMessageToConversation(conversationId, topic, aiMessage, userProfile);
        toast({title: "Translation Complete", description: "Text from image processed."});

      } else { throw new Error("AI response was empty for image translation."); }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get translation for the image content.";
      setError(errorMessage);
      setExtractedText("Error during processing.");
      setTranslatedText("Error during processing.");
      toast({ title: "Translation Error", description: errorMessage, variant: "destructive" });
      const errorAiMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: `Error translating image: ${errorMessage}`, timestamp: Date.now(),
      };
      addMessageToConversation(conversationId, topic, errorAiMessage, userProfile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full flex flex-col shadow-none border-0 min-h-[calc(100vh-25rem)] bg-transparent">
      <CardHeader className="pb-3 pt-2 border-b">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Translate to:</span>
             <Popover open={isLangPopoverOpen} onOpenChange={setIsLangPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isLangPopoverOpen}
                  className="w-[200px] justify-between h-9"
                >
                  <span className="truncate">
                  {targetLang
                    ? LANGUAGES.find((language) => language.value === targetLang)?.label
                    : "Select language..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0">
                <div className="p-2 border-b">
                   <Input 
                      placeholder="Search language..."
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      className="h-9"
                    />
                </div>
                <ScrollArea className="h-60">
                  <div className="p-1">
                  {filteredLanguages.length > 0 ? filteredLanguages.map((language) => (
                    <Button
                      variant="ghost"
                      key={language.value}
                      onClick={() => {
                        setTargetLang(language.value);
                        setIsLangPopoverOpen(false);
                        setLanguageSearch("");
                      }}
                      className="w-full justify-start font-normal text-sm h-9"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          targetLang === language.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{language.label}</span>
                    </Button>
                  )) : (
                    <p className="p-2 text-center text-sm text-muted-foreground">No language found.</p>
                  )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={handleTranslateImage}
            disabled={isLoading || !uploadedImageDataUri}
            size="default"
            className="px-6 py-2.5 text-base h-auto shadow-md w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Camera className="mr-2 h-5 w-5" />}
            Translate Image
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-4 space-y-4 flex flex-col md:flex-row gap-4 items-stretch min-h-0">
        {/* Left Panel - Upload/Preview */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 border-2 border-dashed border-input rounded-xl bg-muted/30 items-center justify-center min-h-[250px] md:min-h-0 relative">
          {uploadedImageDataUri ? (
            <div className="relative w-full h-full max-h-[calc(100vh-35rem)] flex items-center justify-center">
              <NextImage
                src={uploadedImageDataUri}
                alt={uploadedImageFile?.name || "Uploaded image"}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-md"
                data-ai-hint="uploaded image user content"
              />
               <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {setUploadedImageDataUri(null); setUploadedImageFile(null); setExtractedText(null); setTranslatedText(null); if(fileInputRef.current) fileInputRef.current.value = "";}}
                  className="absolute top-2 right-2 z-10 shadow-md"
                >
                  Remove
                </Button>
            </div>
          ) : (
            <div className="text-center">
              <UploadCloud className="h-16 w-16 text-primary opacity-70 mb-3 mx-auto" />
              <p className="text-lg font-semibold text-foreground mb-2">Drag and drop image here</p>
              <p className="text-sm text-muted-foreground mb-3">or</p>
              <Button variant="primary" className="shadow-md" onClick={() => fileInputRef.current?.click()}>
                Browse your files
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <p className="text-xs text-muted-foreground mt-3">Max file size: 4MB. Supported: JPG, PNG, WEBP.</p>
            </div>
          )}
        </div>

        {/* Right Panel - Text Output */}
        <div className="flex-1 flex flex-col gap-4 min-h-[250px] md:min-h-0">
          <div className="flex-1 flex flex-col p-3 sm:p-4 border rounded-xl bg-background shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center"><FileText className="h-4 w-4 mr-1.5"/>Extracted Text</h3>
            <ScrollArea className="flex-grow border rounded-md p-2.5 bg-muted/20 min-h-[100px] text-sm">
              {isLoading && !extractedText && <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto my-2" />}
              {error && !extractedText && <div className="text-destructive text-xs p-1"><Info className="inline h-3.5 w-3.5 mr-1"/>Error extracting.</div>}
              {!isLoading && !error && !extractedText && <p className="text-muted-foreground text-xs italic p-1">Extracted text will appear here...</p>}
              {extractedText && <p className="whitespace-pre-wrap">{extractedText}</p>}
            </ScrollArea>
          </div>
          <div className="flex-1 flex flex-col p-3 sm:p-4 border rounded-xl bg-background shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center"><Languages className="h-4 w-4 mr-1.5"/>Translated Text</h3>
            <ScrollArea className="flex-grow border rounded-md p-2.5 bg-muted/20 min-h-[100px] text-sm">
              {isLoading && !translatedText && <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto my-2" />}
              {error && !translatedText && <div className="text-destructive text-xs p-1"><Info className="inline h-3.5 w-3.5 mr-1"/>Error translating.</div>}
              {!isLoading && !error && !translatedText && <p className="text-muted-foreground text-xs italic p-1">Translation will appear here...</p>}
              {translatedText && <p className="whitespace-pre-wrap">{translatedText}</p>}
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-between gap-2 p-3 border-t text-xs text-muted-foreground sm:flex-row">
        <p className="flex items-center">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 22.0002C17.523 22.0002 22.0002 17.523 22.0002 12.0002C22.0002 6.47731 17.523 2.00024 12.0002 2.00024C6.47731 2.00024 2.00024 6.47731 2.00024 12.0002C2.00024 17.523 6.47731 22.0002 12.0002 22.0002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.50024 12.0002L10.0962 14.5962L16.5002 8.19226" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            Powered by Google Cloud Vision & Translation (Conceptual)
        </p>
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={()=>toast({title:"History", description:"History feature coming soon."})}>
                <History className="h-4 w-4" />
                <span className="sr-only">History</span>
            </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={()=>toast({title:"Saved", description:"Saved translations feature coming soon."})}>
                <Star className="h-4 w-4" />
                 <span className="sr-only">Saved</span>
            </Button>
            <Button variant="link" size="xs" className="text-muted-foreground hover:text-primary p-0 h-auto text-xs" onClick={()=>toast({title:"Feedback", description:"Feedback system coming soon."})}>
                Send feedback
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ImageTextTranslatorInterface;
