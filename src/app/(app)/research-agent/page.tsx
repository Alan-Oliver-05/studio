
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, BrainCircuit, Search, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { researcherFlow } from "@/ai/flows/researcher-flow";
import { writerFlow } from "@/ai/flows/writer-flow";

type ResearchStatus = 'idle' | 'researching' | 'writing' | 'done' | 'error';
interface ResearchStep {
  query: string;
  status: 'pending' | 'loading' | 'done';
  result: string | null;
}

export default function ResearchAgentPage() {
  const [mainQuery, setMainQuery] = useState("");
  const [status, setStatus] = useState<ResearchStatus>('idle');
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStartResearch = async () => {
    if (!mainQuery.trim()) return;

    setStatus('researching');
    setFinalReport(null);
    setError(null);
    toast({ title: "Agent Activated", description: "Starting research process..." });

    // Step 1: Planner (Client-side logic for now)
    // For this demo, we'll parse a "Compare X and Y" query.
    const compareMatch = mainQuery.match(/compare (.*?) and (.*)/i);
    let subQueries: string[] = [];

    if (compareMatch) {
      subQueries = [
        `Key features of ${compareMatch[1].trim()}`,
        `Key features of ${compareMatch[2].trim()}`,
        `Pros and cons of ${compareMatch[1].trim()}`,
        `Pros and cons of ${compareMatch[2].trim()}`
      ];
    } else {
      // For a general query, just do one research step.
      subQueries = [mainQuery];
    }

    const initialSteps: ResearchStep[] = subQueries.map(q => ({
      query: q,
      status: 'pending',
      result: null
    }));
    setResearchSteps(initialSteps);

    // Step 2: Researcher (Calling the flow for each sub-query)
    const researchPromises = initialSteps.map(async (step, index) => {
      setResearchSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'loading' } : s));
      try {
        const result = await researcherFlow({ query: step.query });
        setResearchSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'done', result: result.researchSummary } : s));
        return result.researchSummary;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown research error.";
        setResearchSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'done', result: `Error: ${errorMessage}` } : s));
        throw err; // Propagate error to stop the process
      }
    });

    try {
      const researchResults = await Promise.all(researchPromises);

      // Step 3: Writer
      setStatus('writing');
      toast({ title: "Research Complete", description: "Synthesizing the final report..." });

      const combinedNotes = researchResults.map((result, index) =>
        `Research for "${subQueries[index]}":\n${result}`
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

  const resetState = () => {
    setMainQuery("");
    setStatus('idle');
    setResearchSteps([]);
    setFinalReport(null);
    setError(null);
  };

  return (
    <div className="pb-8 pt-0">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary flex items-center justify-center">
          <BrainCircuit className="mr-3 h-8 w-8 sm:h-10 sm:w-10 text-accent" /> AI Research Agent
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Give the agent a complex task. It will research sub-topics and write a final report.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Start a New Research Task</CardTitle>
          <CardDescription>
            Enter a complex query like "Compare React and Vue" to see the agent in action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={mainQuery}
              onChange={(e) => setMainQuery(e.target.value)}
              placeholder="e.g., Compare React and Next.js for web development"
              className="flex-grow"
              disabled={status !== 'idle'}
              onKeyDown={(e) => { if (e.key === 'Enter' && mainQuery.trim()) { handleStartResearch(); } }}
            />
            <Button onClick={handleStartResearch} disabled={status !== 'idle' || !mainQuery.trim()}>
              <Sparkles className="mr-2 h-4 w-4" /> Start Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {status !== 'idle' && (
        <Card className="w-full max-w-3xl mx-auto shadow-xl mt-6">
          <CardHeader>
            <CardTitle>Agent Progress</CardTitle>
             <Button variant="outline" size="sm" onClick={resetState} className="absolute top-4 right-4">Reset</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {researchSteps.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center"><Search className="mr-2 h-5 w-5 text-primary"/>Research Steps</h3>
                <ul className="space-y-2">
                  {researchSteps.map((step, index) => (
                    <li key={index} className="p-3 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{step.query}</p>
                        {step.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {step.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      {step.result && <p className="text-xs text-muted-foreground mt-1 border-l-2 pl-2 whitespace-pre-wrap">{step.result.length > 150 ? step.result.substring(0, 150) + '...' : step.result}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {status === 'writing' && (
              <div className="flex items-center text-primary font-semibold">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Synthesizing final report...
              </div>
            )}

            {finalReport && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center"><FileText className="mr-2 h-5 w-5 text-green-600"/>Final Report</h3>
                <div className="p-4 border rounded-md prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: finalReport.replace(/\n/g, '<br />') }}></div>
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
