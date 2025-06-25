
"use client";

import React, { useState, useRef, ChangeEvent, useCallback, useMemo } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, FileText, Languages, ArrowRightLeft, Info, History, Star, ChevronDown, Check } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation } from '@/lib/chat-storage';
import { LANGUAGES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';

interface DocumentTranslatorInterfaceProps {
  userProfile: UserProfile;
  conversationId: string;
  topic: string;
}

const LanguageCombobox = ({
  label,
  value,
  onValueChange,
  languageList
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  languageList: { value: string, label: string }[];
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() =>
    languageList.filter(lang =>
      lang.label.toLowerCase().includes(search.toLowerCase())
    ), [search, languageList]
  );

  return (
    <div className="flex-1">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-9 font-normal">
            <span className="truncate">
              {value ? languageList.find(lang => lang.value === value)?.label : `Select ${label}...`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <div className="p-2 border-b">
            <Input placeholder="Search language..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9"/>
          </div>
          <ScrollArea className="h-60">
            <div className="p-1">
              {filteredLanguages.length > 0 ? filteredLanguages.map((language) => (
                <Button variant="ghost" key={language.value} onClick={() => { onValueChange(language.value); setPopoverOpen(false); setSearch(""); }} className="w-full justify-start font-normal text-sm h-9">
                  <Check className={cn("mr-2 h-4 w-4", value === language.value ? "opacity-100" : "opacity-0")} />
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
  );
};

const DocumentTranslatorInterface: React.FC<DocumentTranslatorInterfaceProps> = ({ userProfile, conversationId, topic }) => {
  const [sourceLang, setSourceLang] = useState<string>("detect");
  const [targetLang, setTargetLang] = useState<string>(LANGUAGES.find(l=>l.label.toLowerCase() === userProfile.preferredLanguage.toLowerCase())?.value || 'en');
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [originalFileContent, setOriginalFileContent] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sourceLanguagesWithDetect = useMemo(() => [{ value: "detect", label: "Detect Language" }, ...LANGUAGES], []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload a document smaller than 5MB.", variant: "destructive" });
        return;
      }
      setOriginalFileName(file.name);
      setOriginalFileContent(""); 
      setTranslatedContent("");
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setOriginalFileContent(e.target.result);
          toast({ title: "File Content Loaded", description: `Content from "${file.name}" loaded into the text area.` });
        } else {
          toast({ title: "File Read Error", description: `Could not read text content from "${file.name}".`, variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: `Error reading "${file.name}".`, variant: "destructive" });
      };
      reader.readAsText(file);
    }
  };

  const handleTranslate = async () => {
    if (!originalFileContent.trim()) {
      toast({ title: "Nothing to Translate", description: "Please upload a document or paste text.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranslatedContent("");

    const sourceLangLabel = LANGUAGES.find(l => l.value === sourceLang)?.label || sourceLang;
    const targetLangLabel = LANGUAGES.find(l => l.value === targetLang)?.label || targetLang;

    let questionForAI = `Please translate the following text`;
    if (sourceLang !== "detect") {
      questionForAI += ` from ${sourceLangLabel}`;
    }
    questionForAI += ` to ${targetLangLabel}.`;
    if (originalFileName) {
        questionForAI += ` The text is from a document originally named: "${originalFileName}".`;
    }
    questionForAI += ` The text to translate is: \n\n"${originalFileContent}"`;
    

    const userMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user',
      text: `Request to translate ${originalFileName ? `document "${originalFileName}"` : 'pasted text'}. From: ${sourceLangLabel} To: ${targetLangLabel}. Content snippet: "${originalFileContent.substring(0,50)}..."`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "Language Document Translation", 
        question: questionForAI,
        photoDataUri: undefined, 
      };
      
      (aiInput as any).originalFileName = originalFileName; 

      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        setTranslatedContent(result.response);
        const aiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: result.response,
          suggestions: result.suggestions, timestamp: Date.now(),
        };
        addMessageToConversation(conversationId, topic, aiMessage, userProfile);
      } else { throw new Error("AI response was empty for document translation."); }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to get translation for the document content.";
      setError(errorMessage);
      toast({ title: "Translation Error", description: errorMessage, variant: "destructive" });
      const errorAiMessage: MessageType = {
        id: crypto.randomUUID(), sender: 'ai', text: `Error translating document: ${errorMessage}`, timestamp: Date.now(),
      };
      addMessageToConversation(conversationId, topic, errorAiMessage, userProfile);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSwapLanguages = () => {
    if (sourceLang === "detect") {
        toast({ title: "Cannot Swap", description: "Please select a specific source language to swap.", variant: "default"});
        return;
    }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <Card className="w-full flex flex-col shadow-none border-0 min-h-[calc(100vh-20rem)] bg-transparent">
      <CardHeader className="pb-3 pt-2 border-b">
        <div className="flex items-center justify-between gap-2">
          <LanguageCombobox label="From" value={sourceLang} onValueChange={setSourceLang} languageList={sourceLanguagesWithDetect} />
          <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="text-muted-foreground hover:text-primary flex-shrink-0">
            <ArrowRightLeft className="h-5 w-5" />
          </Button>
          <LanguageCombobox label="To" value={targetLang} onValueChange={setTargetLang} languageList={LANGUAGES} />
        </div>
         <div className="mt-3 text-center">
            <Button
                onClick={handleTranslate}
                disabled={isLoading || !originalFileContent.trim()}
                size="default"
                className="px-8 py-2.5 text-base h-auto shadow-md"
            >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Languages className="mr-2 h-5 w-5" />}
                Translate
            </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-4 space-y-4 flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex-1 flex flex-col p-4 border-2 border-dashed border-input rounded-lg bg-muted/30 items-center justify-start min-h-[300px] md:min-h-0">
          <div className="text-center mb-4">
            <UploadCloud className="h-16 w-16 text-primary opacity-70 mb-3 mx-auto" />
            <p className="text-lg font-semibold text-foreground mb-1">Drag and drop</p>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf,.docx,.pptx,.xlsx" />
            {originalFileName && <p className="text-xs text-muted-foreground mt-1">Selected: <span className="font-medium text-primary">{originalFileName}</span></p>}
          </div>
          <Textarea
            placeholder="Or paste text here directly..."
            value={originalFileContent}
            onChange={(e) => setOriginalFileContent(e.target.value)}
            rows={8}
            className="w-full flex-grow resize-none text-sm bg-background shadow-sm mb-2"
            disabled={isLoading}
          />
        </div>

        <div className="flex-1 flex flex-col p-4 border rounded-lg bg-background shadow-sm min-h-[300px] md:min-h-0">
           <div className="text-center mb-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Or choose a file</p>
            <Button variant="primary" className="shadow-md" onClick={() => fileInputRef.current?.click()}>
              Browse your files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supported file types: .txt, .docx, .pdf
              <Button variant="link" size="xs" className="p-0 ml-1 h-auto text-xs" onClick={()=>toast({title:"Learn More", description:"Full document parsing for PDF/DOCX is conceptual. Currently, only .txt content is directly processed if read by browser."})}>
                Learn more
              </Button>
            </p>
          </div>
          <ScrollArea className="flex-grow border rounded-md p-3 bg-muted/20">
            {isLoading && !translatedContent && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" />}
            {error && <div className="text-destructive text-sm p-2"><Info className="inline h-4 w-4 mr-1"/>Error: {error}</div>}
            {!isLoading && !error && !translatedContent && <p className="text-muted-foreground text-sm italic p-2">Translation will appear here...</p>}
            {translatedContent && <p className="text-sm whitespace-pre-wrap">{translatedContent}</p>}
          </ScrollArea>
        </div>
      </CardContent>
      
      <div className="flex flex-col items-center justify-between gap-2 p-3 border-t text-xs text-muted-foreground sm:flex-row">
        <p className="flex items-center">
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 22.0002C17.523 22.0002 22.0002 17.523 22.0002 12.0002C22.0002 6.47731 17.523 2.00024 12.0002 2.00024C6.47731 2.00024 2.00024 6.47731 2.00024 12.0002C2.00024 17.523 6.47731 22.0002 12.0002 22.0002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.50024 12.0002L10.0962 14.5962L16.5002 8.19226" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            Powered by Google Cloud Translation (Conceptual)
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
      </div>
    </Card>
  );
};

export default DocumentTranslatorInterface;
