"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, BrainCircuit, Search, FileText, CheckCircle, Lightbulb, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { plannerFlow } from "@/ai/flows/planner-flow";
import { researcherFlow } from "@/ai/flows/researcher-flow";
import { writerFlow } from "@/ai/flows/writer-flow";

type AgentStatus = 'idle' | 'planning' | 'researching' | 'writing' | 'done' | 'error';

interface ResearchStep {
  query: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  result: string | null;
}

export default function ResearchAgentPage() {
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

      // Step 2: Researcher (Looping through planned steps)
      setStatus('researching');
      toast({ title: "Plan Created", description: `Starting research on ${initialSteps.length} topics.` });
      
      const researchResults: string[] = [];
      for (let i = 0; i < initialSteps.length; i++) {
        setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'loading' } : s));
        try {
          const result = await researcherFlow({ query: initialSteps[i].query });
          researchResults.push(result.researchSummary);
          setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'done', result: result.researchSummary } : s));
        } catch (researchErr) {
          const errorMessage = researchErr instanceof Error ? researchErr.message : "Unknown research error.";
          setResearchSteps(prev => prev.map((s, idx) => i === idx ? { ...s, status: 'error', result: `Error: ${errorMessage}` } : s));
          throw new Error(`Research failed for query: "${initialSteps[i].query}"`); // Propagate to stop the process
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
      setError(`Process failed: ${errorMessage}`);
      setStatus('error');
      toast({ title: "Agent Process Failed", description: errorMessage, variant: "destructive" });
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
    <div className="pb-8 pt-0">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary flex items-center justify-center">
          <BrainCircuit className="mr-3 h-8 w-8 sm:h-10 sm:w-10 text-accent" /> AI Research Agent
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl mx-auto">
          Give the agent a complex task. It will create a research plan, search the web, and write a final report.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Start a New Research Task</CardTitle>
          <CardDescription>
            Enter a query like "Compare React and Vue" or "What were the main causes of World War 1?".
          </CardDescription>
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
        <Card className="w-full max-w-3xl mx-auto shadow-xl mt-6">
          <CardHeader>
            <CardTitle>Agent Progress</CardTitle>
            <CardDescription>The agent is working on your request: "{mainQuery}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Planner Output */}
            {researchSteps.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/>AI's Research Plan:</h3>
                <ul className="space-y-2">
                  {researchSteps.map((step, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {step.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-transparent" />}
                      {step.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {step.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {step.status === 'error' && <CheckCircle className="h-4 w-4 text-destructive" />}
                      <span className={step.status === 'done' ? 'line-through' : ''}>{step.query}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Researcher Output */}
            {status === 'researching' && researchSteps.some(s => s.status === 'done') && (
                 <div className="p-4 bg-muted/50 rounded-lg border">
                    <h3 className="font-semibold mb-2 flex items-center"><Search className="mr-2 h-5 w-5 text-primary"/>Research in Progress...</h3>
                     <p className="text-xs text-muted-foreground">The agent is gathering information for each step of its plan. The full research notes will be passed to the writer agent.</p>
                </div>
            )}

            {/* Writer Output */}
            {status === 'writing' && (
              <div className="flex items-center text-primary font-semibold p-4 bg-muted/50 rounded-lg border">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                All research complete. Synthesizing final report...
              </div>
            )}

            {finalReport && reportTitle && (
              <div className="border-t pt-4">
                <h3 className="font-bold text-xl mb-2 flex items-center text-primary"><FileText className="mr-2 h-5 w-5"/>{reportTitle}</h3>
                <div className="p-4 border rounded-md prose dark:prose-invert max-w-none text-sm bg-background" dangerouslySetInnerHTML={{ __html: finalReport.replace(/\n/g, '<br />') }}></div>
              </div>
            )}
             {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
                    <p className="font-semibold">An error occurred:</p>
                    <p>{error}</p>
                </div>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
