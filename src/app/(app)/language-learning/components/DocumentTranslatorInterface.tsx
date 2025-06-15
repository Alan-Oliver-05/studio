
"use client";

import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import type { UserProfile, Message as MessageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, FileText, Languages, ArrowRightLeft, Info, History, Star, AlertCircle } from 'lucide-react';
import { aiGuidedStudySession, AIGuidedStudySessionInput } from '@/ai/flows/ai-guided-study-session';
import { addMessageToConversation, getConversationById } from '@/lib/chat-storage';
import { LANGUAGES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentTranslatorInterfaceProps {
  userProfile: UserProfile;
  conversationId: string;
  topic: string;
}

const DocumentTranslatorInterface: React.FC<DocumentTranslatorInterfaceProps> = ({ userProfile, conversationId, topic }) => {
  const [sourceLang, setSourceLang] = useState<string>("detect"); // 'detect' or specific lang code
  const [targetLang, setTargetLang] = useState<string>(userProfile.preferredLanguage.split('-')[0] || "en");
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [originalFileContent, setOriginalFileContent] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for demo
        toast({ title: "File too large", description: "Please upload a document smaller than 5MB.", variant: "destructive" });
        return;
      }
      setOriginalFileName(file.name);
      setOriginalFileContent(""); // Clear pasted text if a file is chosen
      setTranslatedContent("");
      setError(null);
      toast({ title: "File Selected", description: `"${file.name}" is ready. You can paste its content below or directly translate.` });
      
      // For this demo, we are not reading file content automatically.
      // User would paste it or AI would simulate processing.
      // If actual file reading was needed:
      // const reader = new FileReader();
      // reader.onload = (e) => setOriginalFileContent(e.target?.result as string);
      // reader.readAsText(file); // for .txt, .docx, etc. would need libraries
    }
  };

  const handleTranslate = async () => {
    if (!originalFileContent.trim() && !originalFileName) {
      toast({ title: "Nothing to Translate", description: "Please upload a document or paste text.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranslatedContent("");

    let questionForAI = `Please translate the following text content`;
    if (originalFileName) {
      questionForAI += ` (from document: ${originalFileName})`;
    }
    if (sourceLang !== "detect") {
      const sourceLangLabel = LANGUAGES.find(l => l.value === sourceLang)?.label || sourceLang;
      questionForAI += ` from ${sourceLangLabel}`;
    }
    const targetLangLabel = LANGUAGES.find(l => l.value === targetLang)?.label || targetLang;
    questionForAI += ` to ${targetLangLabel}. The text is: \n\n"${originalFileContent}"`;

    const userMessage: MessageType = {
      id: crypto.randomUUID(), sender: 'user',
      text: `Request to translate document: ${originalFileName || 'Pasted Text'}. From: ${sourceLang} To: ${targetLang}. Content snippet: "${originalFileContent.substring(0,50)}..."`,
      timestamp: Date.now(),
    };
    addMessageToConversation(conversationId, topic, userMessage, userProfile);

    try {
      const aiInput: AIGuidedStudySessionInput = {
        studentProfile: { ...userProfile, age: Number(userProfile.age) },
        specificTopic: "Language Document Translation", 
        question: questionForAI, 
        // photoDataUri: can be used if we send a visual preview of the doc later
      };
      
      // Pass originalFileName to the AI prompt context if available
      (aiInput as any).originalFileName = originalFileName; 

      const result = await aiGuidedStudySession(aiInput);
      if (result && result.response) {
        setTranslatedContent(result.response);
        const aiMessage: MessageType = {
          id: crypto.randomUUID(), sender: 'ai', text: `Translated content for ${originalFileName || 'Pasted Text'}:\n${result.response}`,
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

  const languageOptions = [{ value: "detect", label: "Detect Language" }, ...LANGUAGES];

  return (
    <Card className="w-full flex flex-col shadow-none border-0 min-h-[calc(100vh-25rem)] bg-transparent">
      <CardHeader className="pb-4 pt-2">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="text-center sm:text-left mb-3 sm:mb-0">
            <CardTitle className="text-xl sm:text-2xl text-gradient-primary flex items-center">
              <FileText className="mr-2 h-6 w-6"/> Document Translator
            </CardTitle>
            <CardDescription className="text-sm">Translate text from your documents.</CardDescription>
          </div>
           <Button
            onClick={handleTranslate}
            disabled={isLoading || (!originalFileContent.trim() && !originalFileName)}
            size="default"
            className="px-6 text-base h-10 shadow-md w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Languages className="mr-2 h-5 w-5" />}
            Translate Document
          </Button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 border-t border-b py-3">
            <div className="flex-1 w-full sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground db-block mb-1">Source Language</span>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Source Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languageOptions.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground my-2 sm:my-0 flex-shrink-0" />
             <div className="flex-1 w-full sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground db-block mb-1">Target Language</span>
                <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Target Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-2 sm:p-4 space-y-4 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-[300px]">
          {/* Left Panel - Upload/Input */}
          <div className="flex flex-col p-3 sm:p-4 border-2 border-dashed border-input rounded-lg bg-muted/30 items-center justify-center">
            <UploadCloud className="h-12 w-12 text-primary opacity-70 mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Drag and drop your document here</p>
            <p className="text-xs text-muted-foreground mb-3">(or click "Browse your files")</p>
             <Button variant="outline" className="mb-3 shadow-sm" onClick={() => fileInputRef.current?.click()}>
              Browse your files
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf,.docx,.pptx,.xlsx" />
            {originalFileName && <p className="text-xs text-muted-foreground mt-1 mb-2">Selected: <span className="font-medium text-primary">{originalFileName}</span></p>}
             <p className="text-xs text-muted-foreground my-2 w-full text-center border-b pb-2">OR Paste Text Below</p>
            <Textarea
              placeholder="Paste document text here if not uploading a file, or to provide specific text for translation..."
              value={originalFileContent}
              onChange={(e) => setOriginalFileContent(e.target.value)}
              rows={6}
              className="w-full flex-grow resize-none text-sm bg-background shadow-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-2">Supported (for conceptual upload): .docx, .pdf, .pptx, .xlsx, .txt</p>
          </div>

          {/* Right Panel - Translation Output */}
          <div className="flex flex-col p-3 sm:p-4 border rounded-lg bg-background shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-2">Translated Content:</h3>
            <ScrollArea className="flex-grow border rounded-md p-2 bg-muted/20 min-h-[150px] md:min-h-0">
              {isLoading && !translatedContent && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" />}
              {error && <div className="text-destructive text-sm p-2"><AlertCircle className="inline h-4 w-4 mr-1"/>Error: {error}</div>}
              {!isLoading && !error && !translatedContent && <p className="text-muted-foreground text-sm italic p-2">Translation will appear here...</p>}
              {translatedContent && <p className="text-sm whitespace-pre-wrap">{translatedContent}</p>}
            </ScrollArea>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground mt-3">
          <Info className="inline h-3 w-3 mr-1" />
          For best results with complex documents, ensure text is clearly formatted. Current translation is based on pasted/provided text.
        </div>
        
        <div className="text-center text-xs text-muted-foreground mt-auto pt-3">
            Powered by Google Cloud Translation (Conceptual)
        </div>
         <div className="flex justify-center gap-3 mt-2 pt-3 border-t">
            <Button variant="outline" size="sm" className="text-xs opacity-70 hover:opacity-100">
                <History className="mr-1.5 h-3.5 w-3.5"/> View History
            </Button>
             <Button variant="outline" size="sm" className="text-xs opacity-70 hover:opacity-100">
                <Star className="mr-1.5 h-3.5 w-3.5"/> Saved Translations
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentTranslatorInterface;
