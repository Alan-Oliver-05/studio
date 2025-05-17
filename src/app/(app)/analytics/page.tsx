
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChartBig, BookOpen, Brain, CheckCircle, FileText, History, Languages, Layers, ListChecks, Loader2, MessageSquare, PenSquare, PieChartIcon, TrendingUp, Users } from "lucide-react";
import { getConversations } from "@/lib/chat-storage";
import type { Conversation, Task, Note } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";


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
  byPriority: Record<string, number>;
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
      
      // Calculate session stats
      const newSessionStats: SessionStats = {
        totalSessions: conversations.length,
        totalMessages: conversations.reduce((acc, curr) => acc + curr.messages.length, 0),
        sessionsByType: {},
        studySubjects: {},
      };

      conversations.forEach(convo => {
        let typeKey = convo.subjectContext || convo.topic || "Uncategorized";
        if (convo.topic === "AI Learning Assistant Chat") typeKey = "General AI Tutor";
        else if (convo.topic === "LanguageLearningMode") typeKey = "Language Learning";
        else if (convo.topic === "Homework Help") typeKey = "Homework Helper";
        else if (convo.subjectContext) typeKey = convo.subjectContext; // Group by subject for study sessions

        if (!newSessionStats.sessionsByType[typeKey]) {
          newSessionStats.sessionsByType[typeKey] = { count: 0, totalMessages: 0, summarizedCount: 0 };
        }
        newSessionStats.sessionsByType[typeKey].count++;
        newSessionStats.sessionsByType[typeKey].totalMessages += convo.messages.length;
        if (convo.summary) {
          newSessionStats.sessionsByType[typeKey].summarizedCount++;
        }

        if (convo.subjectContext && convo.topic !== "AI Learning Assistant Chat" && convo.topic !== "LanguageLearningMode" && convo.topic !== "Homework Help") {
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

      // Calculate task stats
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
      
      // Calculate note stats
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
    name,
    sessions: data.count,
  })).sort((a,b) => b.sessions - a.sessions) : [];

  const taskStatusChartData = taskStats ? [
    { name: "Pending", value: taskStats.pending, fill: "hsl(var(--chart-2))" },
    { name: "Completed", value: taskStats.completed, fill: "hsl(var(--chart-1))" },
  ] : [];
  
  const taskPriorityChartData = taskStats ? [
    { name: "High", value: taskStats.byPriority.High, fill: "hsl(var(--destructive))"},
    { name: "Medium", value: taskStats.byPriority.Medium, fill: "hsl(var(--chart-4))" },
    { name: "Low", value: taskStats.byPriority.Low, fill: "hsl(var(--chart-5))" },
  ].filter(d => d.value > 0) : [];


  const StatCard = ({ title, value, icon, description, children }: { title: string, value: string | number, icon?: React.ReactNode, description?: string, children?: React.ReactNode }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardDescription className="flex items-center text-sm">
                {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
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

  return (
    <div className="pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
      <div className="mb-6 pt-0">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
          <BarChartBig className="mr-3 h-8 w-8" /> Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Insights into your learning patterns and progress.
        </p>
      </div>

      {sessionStats && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center"><MessageSquare className="mr-2 h-6 w-6"/>Chat Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Chat Sessions" value={sessionStats.totalSessions} icon={<History />} description="All recorded chat interactions." />
            <StatCard title="Total Messages Exchanged" value={sessionStats.totalMessages} icon={<FileText />} description="Sum of all messages sent by you and AI." />
            <StatCard title="Avg Messages / Session" value={(sessionStats.totalMessages / (sessionStats.totalSessions || 1)).toFixed(1)} icon={<TrendingUp />} description="Average conversation length."/>
          </div>
          
          {sessionsChartData.length > 0 && (
            <Card className="mt-6 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Layers className="mr-2 h-5 w-5"/>Learning Sessions Breakdown</CardTitle>
                <CardDescription>Number of sessions per category.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} allowDecimals={false}/>
                    <RechartsTooltip
                        content={<ChartTooltipContent labelKey="sessions" />}
                        cursor={{fill: "hsl(var(--muted))"}}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 space-y-4">
            {Object.entries(sessionStats.sessionsByType).map(([type, data]) => (
              <Card key={type} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-accent">
                    {type === "General AI Tutor" ? <Brain className="inline mr-2 h-5 w-5"/> : 
                     type === "Language Learning" ? <Languages className="inline mr-2 h-5 w-5"/> : 
                     type === "Homework Helper" ? <PenSquare className="inline mr-2 h-5 w-5"/> :
                     <BookOpen className="inline mr-2 h-5 w-5"/> 
                    }
                    {type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <p><strong className="text-primary">{data.count}</strong> session{data.count === 1 ? '' : 's'}</p>
                    <p><strong className="text-primary">{data.totalMessages}</strong> message{data.totalMessages === 1 ? '' : 's'}</p>
                    <p><strong className="text-primary">{data.summarizedCount}</strong> summarized</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {taskStats && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center"><ListChecks className="mr-2 h-6 w-6"/>Task Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Tasks" value={taskStats.totalTasks} icon={<ListChecks />} />
            <StatCard title="Tasks Completed" value={taskStats.completed} icon={<CheckCircle className="text-green-500"/>} />
            <StatCard title="Tasks Pending" value={taskStats.pending} icon={<History className="text-yellow-500"/>} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {taskStatusChartData.length > 0 && taskStatusChartData.some(d => d.value > 0) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><PieChartIcon className="mr-2 h-5 w-5"/>Task Status Overview</CardTitle>
                  <CardDescription>Distribution of pending vs. completed tasks.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40} // For Doughnut
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            
            {taskPriorityChartData.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><TrendingUp className="mr-2 h-5 w-5"/>Tasks by Priority</CardTitle>
                  <CardDescription>Distribution of tasks by their priority.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskPriorityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40} 
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskPriorityChartData.map((entry, index) => (
                          <Cell key={`cell-prio-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                       <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {noteStats && (
         <section>
            <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center"><FileText className="mr-2 h-6 w-6"/>Notepad Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Notes Created" value={noteStats.totalNotes} icon={<FileText />} />
            </div>
         </section>
      )}
      
      {!sessionStats && !taskStats && !noteStats && (
        <Card className="text-center py-12 shadow-lg max-w-2xl mx-auto">
            <CardHeader className="p-4">
            <div className="mx-auto bg-accent/10 rounded-full p-4 w-fit">
                <BarChartBig className="h-12 w-12 text-accent" />
            </div>
            <CardTitle className="mt-6 text-2xl">No Analytics Data Yet</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
            <p className="text-muted-foreground">
                Start using the app to see your learning analytics here.
                Engage in chat sessions, create tasks, and take notes!
            </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
