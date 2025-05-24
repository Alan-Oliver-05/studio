
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChartBig, BookOpen, Brain, CheckCircle, FileText, History, Languages, Layers, ListChecks, Loader2, MessageSquare, PenSquare, PieChartIcon, TrendingUp, Users, Info, Sparkles, Home as HomeIcon } from "lucide-react";
import { getConversations } from "@/lib/chat-storage";
import type { Conversation, Task, Note, TaskPriority } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";


interface SessionStats {
  totalSessions: number;
  totalMessages: number;
  sessionsByType: Record<string, { count: number; totalMessages: number; summarizedCount: number }>;
  studySubjects: Record<string, { count: number; totalMessages: number; summarizedCount: number }>;
}

interface TaskStats {
  totalTasks: number;
  completed: number;
  pending: number;
  byPriority: Record<TaskPriority, number>;
}

interface NoteStats {
  totalNotes: number;
}

const LOCAL_STORAGE_TASKS_KEY = 'eduai-tasks';
const LOCAL_STORAGE_NOTES_KEY = 'eduai-notes';

export default function AnalyticsPage() {
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [noteStats, setNoteStats] = useState<NoteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setIsLoading(true);
      const conversations = getConversations();
      
      const newSessionStats: SessionStats = {
        totalSessions: conversations.length,
        totalMessages: conversations.reduce((acc, curr) => acc + curr.messages.length, 0),
        sessionsByType: {},
        studySubjects: {},
      };

      conversations.forEach(convo => {
        let typeKey = convo.subjectContext || convo.topic || "Uncategorized";
        if (convo.topic === "AI Learning Assistant Chat") typeKey = "General AI Tutor";
        else if (convo.topic === "LanguageTranslatorMode") typeKey = "Language Translator";
        else if (convo.topic === "Homework Help") typeKey = "Homework Helper";
        else if (convo.topic === "Visual Learning" || convo.topic === "Visual Learning Focus") typeKey = "Visual Learning";
        else if (convo.subjectContext) typeKey = convo.subjectContext; 

        if (!newSessionStats.sessionsByType[typeKey]) {
          newSessionStats.sessionsByType[typeKey] = { count: 0, totalMessages: 0, summarizedCount: 0 };
        }
        newSessionStats.sessionsByType[typeKey].count++;
        newSessionStats.sessionsByType[typeKey].totalMessages += convo.messages.length;
        if (convo.summary) {
          newSessionStats.sessionsByType[typeKey].summarizedCount++;
        }

        if (convo.subjectContext && convo.topic !== "AI Learning Assistant Chat" && convo.topic !== "LanguageTranslatorMode" && convo.topic !== "Homework Help" && convo.topic !== "Visual Learning" && convo.topic !== "Visual Learning Focus") {
           if (!newSessionStats.studySubjects[convo.subjectContext]) {
             newSessionStats.studySubjects[convo.subjectContext] = { count: 0, totalMessages: 0, summarizedCount: 0 };
           }
           newSessionStats.studySubjects[convo.subjectContext].count++;
           newSessionStats.studySubjects[convo.subjectContext].totalMessages += convo.messages.length;
           if (convo.summary) {
             newSessionStats.studySubjects[convo.subjectContext].summarizedCount++;
           }
        }
      });
      setSessionStats(newSessionStats);

      try {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
        const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
        const newTasksStats: TaskStats = {
          totalTasks: tasks.length,
          completed: tasks.filter(t => t.status === "completed").length,
          pending: tasks.filter(t => t.status === "pending").length,
          byPriority: { High: 0, Medium: 0, Low: 0 },
        };
        tasks.forEach(task => {
          newTasksStats.byPriority[task.priority] = (newTasksStats.byPriority[task.priority] || 0) + 1;
        });
        setTaskStats(newTasksStats);
      } catch (e) {
        console.error("Error loading task stats:", e);
        setTaskStats({ totalTasks: 0, completed: 0, pending: 0, byPriority: { High: 0, Medium: 0, Low: 0 } });
      }
      
      try {
        const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
        const notes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];
        setNoteStats({ totalNotes: notes.length });
      } catch (e) {
        console.error("Error loading note stats:", e);
        setNoteStats({ totalNotes: 0 });
      }

      setIsLoading(false);
    }
  }, [isClient]);

  if (isLoading || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const sessionsChartData = sessionStats ? Object.entries(sessionStats.sessionsByType).map(([name, data]) => ({
    name: name.length > 20 ? name.substring(0,17) + '...' : name, // Truncate long names
    sessions: data.count,
  })).sort((a,b) => b.sessions - a.sessions) : [];

  const sessionsChartConfig: ChartConfig = {
    sessions: { label: "Sessions", color: "hsl(var(--primary))" },
  };
  sessionsChartData.forEach(item => { 
      if (!sessionsChartConfig[item.name]) {
          const colorIndex = (Object.keys(sessionsChartConfig).length -1) % 5; 
          sessionsChartConfig[item.name] = { label: item.name, color: `hsl(var(--chart-${colorIndex + 1}))` }; 
      }
  });


  const taskStatusChartData = taskStats ? [
    { name: "Pending", value: taskStats.pending, fill: "hsl(var(--chart-2))" },
    { name: "Completed", value: taskStats.completed, fill: "hsl(var(--chart-1))" },
  ].filter(d => d.value > 0) : []; 
  
  const taskStatusChartConfig: ChartConfig = {};
  taskStatusChartData.forEach(item => {
    taskStatusChartConfig[item.name] = { label: item.name, color: item.fill };
  });


  const taskPriorityChartData = taskStats ? [
    { name: "High", value: taskStats.byPriority.High, fill: "hsl(var(--destructive))"},
    { name: "Medium", value: taskStats.byPriority.Medium, fill: "hsl(var(--chart-4))" },
    { name: "Low", value: taskStats.byPriority.Low, fill: "hsl(var(--chart-5))" },
  ].filter(d => d.value > 0) : []; 

  const taskPriorityChartConfig: ChartConfig = {};
    taskPriorityChartData.forEach(item => {
    taskPriorityChartConfig[item.name] = { label: item.name, color: item.fill };
  });


  const StatCard = ({ title, value, icon, description, children }: { title: string, value: string | number, icon?: React.ReactNode, description?: string, children?: React.ReactNode }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardDescription className="flex items-center text-sm text-muted-foreground">
                {icon && <span className="mr-2 text-primary">{icon}</span>}
                {title}
            </CardDescription>
        </div>
        <CardTitle className="text-3xl font-bold text-primary">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
  
  const noDataAvailable = (!sessionStats || sessionStats.totalSessions === 0) && 
                           (!taskStats || taskStats.totalTasks === 0) && 
                           (!noteStats || noteStats.totalNotes === 0);


  return (
    <div className="pb-4 pt-0">
      <div className="mb-6 pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
          <BarChartBig className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Insights into your learning patterns and progress.
        </p>
      </div>

      {noDataAvailable && (
        <Card className="text-center py-12 shadow-lg max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-4">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-6 text-2xl text-foreground">No Analytics Data Yet</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
            <p className="text-muted-foreground">
                Start using the app to see your learning analytics here!
                Engage in chat sessions, create tasks, and take notes to populate this dashboard.
            </p>
            </CardContent>
             <CardFooter className="justify-center p-4">
                <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </CardFooter>
        </Card>
      )}

      {!noDataAvailable && sessionStats && sessionStats.totalSessions > 0 && (
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-4 flex items-center"><MessageSquare className="mr-2 h-5 w-5 sm:h-6 sm:w-6"/>Chat Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Chat Sessions" value={sessionStats.totalSessions} icon={<History />} description="All recorded chat interactions." />
            <StatCard title="Total Messages" value={sessionStats.totalMessages} icon={<FileText />} description="Sum of messages by you and AI." />
            <StatCard title="Avg Messages / Session" value={(sessionStats.totalMessages / (sessionStats.totalSessions || 1)).toFixed(1)} icon={<TrendingUp />} description="Average conversation length."/>
          </div>
          
          {sessionsChartData.length > 0 && (
            <Card className="mt-6 shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center text-foreground"><Layers className="mr-2 h-5 w-5 text-primary"/>Session Types</CardTitle>
                <CardDescription>Number of sessions per category.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={sessionsChartConfig} className="h-[300px] md:h-[350px] w-full">
                  <BarChart data={sessionsChartData} margin={{ top: 5, right: 0, left: -20, bottom: sessionsChartData.length > 4 ? 50 : 5 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                        tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} 
                        interval={0}
                        angle={sessionsChartData.length > 4 ? -30 : 0}
                        textAnchor={sessionsChartData.length > 4 ? "end" : "middle"}
                        height={sessionsChartData.length > 4 ? 60 : 30}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} allowDecimals={false}/>
                    <ChartTooltip
                        cursor={{fill: "hsla(var(--muted), 0.5)"}}
                        content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                       {sessionsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={sessionsChartConfig[entry.name]?.color || "hsl(var(--primary))"} />
                       ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 space-y-4">
            {Object.entries(sessionStats.sessionsByType).sort(([,a],[,b]) => b.count - a.count).map(([type, data]) => (
              <Card key={type} className="shadow-md bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm sm:text-base font-semibold text-accent flex items-center">
                    {type === "General AI Tutor" ? <Brain className="inline mr-2 h-4 w-4"/> : 
                     type === "Language Learning" || type === "Language Translator" ? <Languages className="inline mr-2 h-4 w-4"/> : 
                     type === "Homework Helper" ? <PenSquare className="inline mr-2 h-4 w-4"/> :
                     type === "Visual Learning" ? <PieChartIcon className="inline mr-2 h-4 w-4"/> :
                     <BookOpen className="inline mr-2 h-4 w-4"/> 
                    }
                    {type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs px-4 pb-3">
                    <p><strong className="text-primary">{data.count}</strong> session{data.count === 1 ? '' : 's'}</p>
                    <p><strong className="text-primary">{data.totalMessages}</strong> message{data.totalMessages === 1 ? '' : 's'}</p>
                    <p><strong className="text-primary">{data.summarizedCount}</strong> summarized</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!noDataAvailable && taskStats && taskStats.totalTasks > 0 && (
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-4 flex items-center"><ListChecks className="mr-2 h-5 w-5 sm:h-6 sm:w-6"/>Task Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Tasks" value={taskStats.totalTasks} icon={<ListChecks />} />
            <StatCard title="Tasks Completed" value={taskStats.completed} icon={<CheckCircle className="text-green-500"/>} />
            <StatCard title="Tasks Pending" value={taskStats.pending} icon={<History className="text-yellow-500"/>} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {taskStatusChartData.length > 0 && (
              <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center text-foreground"><PieChartIcon className="mr-2 h-5 w-5 text-primary"/>Task Status</CardTitle>
                  <CardDescription>Distribution of pending vs. completed tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={taskStatusChartConfig} className="h-[250px] md:h-[300px] w-full aspect-auto">
                    <PieChart accessibilityLayer>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Pie data={taskStatusChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {taskStatusChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: "12px", color: "hsl(var(--muted-foreground))"}}/>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            
            {taskPriorityChartData.length > 0 && (
              <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center text-foreground"><TrendingUp className="mr-2 h-5 w-5 text-primary"/>Tasks by Priority</CardTitle>
                  <CardDescription>Distribution of tasks by their priority.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={taskPriorityChartConfig} className="h-[250px] md:h-[300px] w-full aspect-auto">
                    <PieChart accessibilityLayer>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Pie data={taskPriorityChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {taskPriorityChartData.map((entry, index) => ( <Cell key={`cell-prio-${index}`} fill={entry.fill} /> ))}
                      </Pie>
                       <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: "12px", color: "hsl(var(--muted-foreground))"}}/>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
           {taskStats.totalTasks > 0 && taskStatusChartData.length === 0 && taskPriorityChartData.length === 0 && (
            <Card className="mt-6 p-6 text-center text-muted-foreground bg-card/80 backdrop-blur-sm border-border/50">
              <Info className="mx-auto h-8 w-8 mb-2"/>
              Task charts are not shown because all tasks are either in one status (e.g., all pending) or one priority. Add more varied tasks to see charts.
            </Card>
          )}
        </section>
      )}

      {!noDataAvailable && noteStats && noteStats.totalNotes > 0 && (
         <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-4 flex items-center"><FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6"/>Notepad Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Notes Created" value={noteStats.totalNotes} icon={<FileText />} description="All notes saved in your notepad."/>
            </div>
         </section>
      )}
    </div>
  );
}


    