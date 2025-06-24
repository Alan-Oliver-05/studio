
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, MessagesSquare, Loader2, AlertTriangle, Sparkles, Search, FileText, CheckCircle, Lightbulb, RotateCcw } from "lucide-react";
import dynamic from 'next/dynamic';
import { useUserProfile } from "@/contexts/user-profile-context";
import { useSearchParams, useRouter } from 'next/navigation';
import { getConversationById } from "@/lib/chat-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { plannerFlow } from "@/ai/flows/planner-flow";
import { researcherFlow } from "@/ai/flows/researcher-flow";
import { writerFlow } from "@/ai/flows/writer-flow";
import Link from "next/link";

// Dynamic import for the chat interface
const DynamicChatInterface = dynamic(() =>
  import('../study-session/components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

// --- Research Agent Component Logic ---
type AgentStatus = 'idle' | 'planning' | 'researching' | 'writing' | 'done' | 'error';
interface ResearchStep {
  query: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  result: string | null;
}

const ResearchAgentComponent = () => {
  const [mainQuery, setMainQuery] = useState("");
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStartResearch = async () => {
    if (!mainQuery.trim()) return;
    resetState(false);
    setStatus('planning');
    toast({ title: "Agent Activated", description: "Planning research steps..." });

    try {
      // Step 1: Planner
      const plannerResult = await plannerFlow({ goal: mainQuery });
      setReportTitle(plannerResult.reportTitle);
      const initialSteps: ResearchStep[] = plannerResult.researchQueries.map(q => ({
        query: q, status: 'pending', result: null,
      }));
      setResearchSteps(initialSteps);

      setStatus('researching');
      toast({ title: "Plan Created", description: `Starting research on ${initialSteps.length} topics.` });
      
      const researchResults: string[] = [];
      
      // Step 2: Researcher (Looping through planned steps)
      for (let i = 0; i < initialSteps.length; i++) {
        setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'loading' } : s));
        try {
          const result = await researcherFlow({ query: initialSteps[i].query });
          const summary = result.researchSummary;

          // Critical check: Stop immediately if any search fails.
          if (summary.startsWith("Error:")) {
             // The researcherFlow now provides a user-friendly error.
             throw new Error(summary);
          }

          researchResults.push(summary);
          setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'done', result: summary } : s));
        } catch (researchErr) {
          const errorMessage = researchErr instanceof Error ? researchErr.message : "Unknown research error.";
          setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'error', result: `Error: ${errorMessage}` } : s));
          throw new Error(`Research failed for query: "${initialSteps[i].query}". Reason: ${errorMessage}`);
        }
      }

      // Step 3: Writer
      setStatus('writing');
      toast({ title: "Research Complete", description: "Synthesizing the final report..." });

      const combinedNotes = researchResults.map((result, index) =>
        `Research for "${initialSteps[index].query}":\n${result}`
      ).join("\n\n---\n\n");

      const writerResult = await writerFlow({
        goal: mainQuery,
        researchNotes: combinedNotes,
      });

      setFinalReport(writerResult.writtenResponse);
      setStatus('done');
      toast({ title: "Report Generated!", description: "The AI agent has completed its task." });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An agent task failed.";
      setError(errorMessage);
      setStatus('error');
      toast({ title: "Agent Process Failed", description: "See details below.", variant: "destructive", duration: 7000 });
    }
  };

  const resetState = (clearQuery = true) => {
    if(clearQuery) setMainQuery("");
    setStatus('idle');
    setResearchSteps([]);
    setFinalReport(null);
    setReportTitle(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Start a New Research Task</CardTitle>
          <CardDescription>Enter a complex query. The agent will plan, search the web, and write a report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={mainQuery}
              onChange={(e) => setMainQuery(e.target.value)}
              placeholder="e.g., Compare React.js and Vue.js"
              className="flex-grow"
              disabled={status !== 'idle'}
              onKeyDown={(e) => { if (e.key === 'Enter' && mainQuery.trim()) { handleStartResearch(); } }}
            />
            <Button onClick={handleStartResearch} disabled={status !== 'idle' || !mainQuery.trim()}>
              <Sparkles className="mr-2 h-4 w-4" /> Start Agent
            </Button>
          </div>
        </CardContent>
        {status !== 'idle' && (
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => resetState(true)}>Reset Agent</Button>
          </CardFooter>
        )}
      </Card>

      {status !== 'idle' && (
        <Card className="w-full shadow-xl mt-6">
          <CardHeader>
            <CardTitle>Agent Progress</CardTitle>
            <CardDescription>Working on: "{mainQuery}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {researchSteps.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/>AI's Research Plan:</h3>
                <ul className="space-y-2">
                  {researchSteps.map((step, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {step.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-transparent" />}
                      {step.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {step.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {step.status === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <span className={step.status === 'done' ? 'line-through' : ''}>{step.query}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {status === 'writing' && (
              <div className="flex items-center text-primary font-semibold p-4 bg-muted/50 rounded-lg border">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />All research complete. Synthesizing final report...
              </div>
            )}
             {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
                    <p className="font-semibold flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/>An error occurred:</p>
                    <p className="mt-1 font-mono text-xs whitespace-pre-wrap">{error}</p>
                </div>
             )}
            {finalReport && reportTitle && (
              <div className="border-t pt-4">
                <h3 className="font-bold text-xl mb-2 flex items-center text-primary"><FileText className="mr-2 h-5 w-5"/>{reportTitle}</h3>
                <div className="p-4 border rounded-md prose dark:prose-invert max-w-none text-sm bg-background whitespace-pre-wrap">{finalReport}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};


// --- Conversational Tutor Component Logic ---
const ConversationalTutorComponent = () => {
    const { profile, isLoading: profileLoading } = useUserProfile();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [chatKey, setChatKey] = useState<string>('');

    const initializeNewSession = useCallback(() => {
        if (profile) {
            const profileIdentifier = profile.id || `user-${profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous'}`;
            const newTimestamp = Date.now();
            const newId = `general-tutor-${profileIdentifier}-${newTimestamp}`;
            setCurrentConversationId(newId);
            setChatKey(newId);
            if (searchParams.get('sessionId')) {
                router.replace('/agent?tab=tutor', { scroll: false });
            }
        }
    }, [profile, router, searchParams]);

    useEffect(() => {
        const sessionIdFromQuery = searchParams.get('sessionId');
        if (sessionIdFromQuery) {
            const conversation = getConversationById(sessionIdFromQuery);
            if (conversation && conversation.topic === "AI Learning Assistant Chat") {
                setCurrentConversationId(sessionIdFromQuery);
                setChatKey(sessionIdFromQuery);
            } else {
                initializeNewSession();
            }
        } else if (profile) {
            initializeNewSession();
        }
    }, [searchParams, profile, initializeNewSession]);

    if (profileLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
                <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
                <p className="text-muted-foreground mb-6 max-w-md">To use the AI tutor, we need your profile information.</p>
                <Button asChild size="lg"><Link href="/onboarding">Go to Onboarding</Link></Button>
            </div>
        );
    }
    if (!currentConversationId || !chatKey) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Initializing chat...</p></div>;
    }

    const initialMainChatMessage = `Hi ${profile.name}! I'm your AI Learning Assistant. Ask me any question about your studies, homework, or concepts you'd like to understand better. How can I help you today?`;

    return (
        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col items-center min-h-0">
             <div className="flex items-center justify-between w-full mb-4">
                <h2 className="text-xl font-semibold">Conversational Tutor</h2>
                <Button onClick={initializeNewSession} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4"/> New Conversation
                </Button>
            </div>
            <div className="w-full flex-grow min-h-0 h-[70vh] rounded-lg border">
                <DynamicChatInterface
                    key={chatKey}
                    userProfile={profile}
                    topic="AI Learning Assistant Chat"
                    conversationId={currentConversationId}
                    initialSystemMessage={initialMainChatMessage}
                    placeholderText="Ask anything or upload an image..."
                    enableImageUpload={true}
                />
            </div>
        </div>
    );
};

export default function UnifiedAgentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'tutor';

    const handleTabChange = (value: string) => {
        router.push(`/agent?tab=${value}`, { scroll: false });
    };

    return (
        <div className="pb-8 pt-0">
            <div className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary flex items-center justify-center">
                    Unified EduAI Agent
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                    Your integrated AI partner for both quick questions and in-depth research.
                </p>
            </div>
            <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="tutor"><MessagesSquare className="mr-2 h-4 w-4"/>Conversational Tutor</TabsTrigger>
                    <TabsTrigger value="researcher"><BrainCircuit className="mr-2 h-4 w-4"/>Research Agent</TabsTrigger>
                </TabsList>
                <TabsContent value="tutor" className="mt-6">
                    <ConversationalTutorComponent />
                </TabsContent>
                <TabsContent value="researcher" className="mt-6">
                    <ResearchAgentComponent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
