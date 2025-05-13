
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { ChatInterface } from "../components/chat-interface";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lesson, Topic, UserProfile as UserProfileType } from "@/types";
import { getLessonsForSubject, GetLessonsForSubjectInput } from "@/ai/flows/get-lessons-for-subject";
import { getTopicsForLesson, GetTopicsForLessonInput } from "@/ai/flows/get-topics-for-lesson";
import { Loader2, AlertTriangle, ChevronRight, BookOpen, Lightbulb, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type StudyStep = "selectLesson" | "selectTopic" | "chat" | "loading" | "error";

export default function StudySessionPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const params = useParams();
  const router = useRouter();
  
  const subjectName = typeof params.subject === 'string' ? decodeURIComponent(params.subject) : "Selected Topic";

  const [currentStep, setCurrentStep] = useState<StudyStep>("loading");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    if (!profileLoading && profile && subjectName) {
      setCurrentStep("loading");
      setErrorMessage(null);
      const fetchLessons = async () => {
        try {
          const input: GetLessonsForSubjectInput = {
            subjectName,
            studentProfile: {
              ...profile,
              age: Number(profile.age) // Ensure age is number for AI flow
            } as UserProfileType & { age: number }, 
          };
          const result = await getLessonsForSubject(input);
          if (result && result.lessons && result.lessons.length > 0) {
            setLessons(result.lessons);
            setCurrentStep("selectLesson");
          } else {
            setErrorMessage(`No lessons found for ${subjectName}. Try another subject or use the General Tutor.`);
            setCurrentStep("error");
          }
        } catch (e) {
          console.error("Failed to fetch lessons:", e);
          setErrorMessage("Failed to load lessons. Please try again or check your connection.");
          setCurrentStep("error");
        }
      };
      fetchLessons();
    }
  }, [profile, profileLoading, subjectName]);

  const handleSelectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentStep("loading");
    setErrorMessage(null);
    if(profile){
        try {
            const input: GetTopicsForLessonInput = {
            subjectName,
            lessonName: lesson.name,
            studentProfile: {
              ...profile,
              age: Number(profile.age)
            } as UserProfileType & { age: number },
            };
            const result = await getTopicsForLesson(input);
            if (result && result.topics && result.topics.length > 0) {
            setTopics(result.topics);
            setCurrentStep("selectTopic");
            } else {
            setErrorMessage(`No topics found for lesson "${lesson.name}". Please select another lesson or go back.`);
            setCurrentStep("error"); // Or back to selectLesson?
            }
        } catch (e) {
            console.error("Failed to fetch topics:", e);
            setErrorMessage("Failed to load topics. Please try again.");
            setCurrentStep("error");
        }
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentStep("chat");
  };
  
  const handleRetry = () => {
    if (selectedLesson && currentStep === "error" && errorMessage?.includes("topics")) {
        // Error was while fetching topics, retry fetching topics for selectedLesson
        handleSelectLesson(selectedLesson);
    } else {
        // Error was while fetching lessons or other general error, refetch lessons
         if (!profileLoading && profile && subjectName) {
            setCurrentStep("loading");
            setErrorMessage(null);
            const fetchLessons = async () => {
                try {
                const input: GetLessonsForSubjectInput = {
                    subjectName,
                    studentProfile: {
                    ...profile,
                    age: Number(profile.age)
                    } as UserProfileType & { age: number }, 
                };
                const result = await getLessonsForSubject(input);
                if (result && result.lessons && result.lessons.length > 0) {
                    setLessons(result.lessons);
                    setCurrentStep("selectLesson");
                } else {
                    setErrorMessage(`No lessons found for ${subjectName}. Try another subject or use the General Tutor.`);
                    setCurrentStep("error");
                }
                } catch (e) {
                console.error("Failed to fetch lessons:", e);
                setErrorMessage("Failed to load lessons. Please try again or check your connection.");
                setCurrentStep("error");
                }
            };
            fetchLessons();
            }
    }
  };


  if (profileLoading || (currentStep === "loading" && !errorMessage)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading study materials for {subjectName}...</p>
      </div>
    );
  }

  if (!profile) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To start a study session, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  if (currentStep === "error" && errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Alert variant="destructive" className="max-w-lg text-center">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-6 space-x-4">
            <Button onClick={handleRetry}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ display: currentStep === 'loading' ? 'inline-block' : 'none'}} />
                Retry
            </Button>
            <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
        </div>
      </div>
    );
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case "selectLesson":
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Choose a Lesson in {subjectName}</CardTitle>
              <CardDescription>Select a lesson to see its topics.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)] pr-4"> {/* Adjust height as needed */}
                <div className="space-y-3">
                  {lessons.map((lesson, idx) => (
                    <Button key={idx} variant="outline" className="w-full justify-between text-left h-auto py-3 px-4" onClick={() => handleSelectLesson(lesson)}>
                      <div className="flex-1">
                        <p className="font-semibold text-md">{lesson.name}</p>
                        {lesson.description && <p className="text-xs text-muted-foreground mt-1">{lesson.description}</p>}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </CardFooter>
          </Card>
        );
      case "selectTopic":
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Choose a Topic in {selectedLesson?.name}</CardTitle>
              <CardDescription>Select a topic to start your Q&amp;A session.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-22rem)] pr-4"> {/* Adjust height as needed */}
                <div className="space-y-3">
                  {topics.map((topic, idx) => (
                    <Button key={idx} variant="outline" className="w-full justify-between text-left h-auto py-3 px-4" onClick={() => handleSelectTopic(topic)}>
                       <div className="flex-1">
                        <p className="font-semibold text-md">{topic.name}</p>
                        {topic.description && <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>}
                      </div>
                      <CheckCircle className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => {setSelectedLesson(null); setTopics([]); setCurrentStep("selectLesson");}}>Back to Lessons</Button>
            </CardFooter>
          </Card>
        );
      case "chat":
        if (selectedTopic && selectedLesson && profile) {
          const conversationId = `study-session-${profile.id || 'default'}-${subjectName.replace(/\s+/g, '_')}-${selectedLesson.name.replace(/\s+/g, '_')}-${selectedTopic.name.replace(/\s+/g, '_')}`.toLowerCase();
          const initialMessage = `Hello ${profile.name}! Let's start our Q&A session on "${selectedTopic.name}" from the lesson "${selectedLesson.name}" in "${subjectName}". What aspect of "${selectedTopic.name}" would you like to explore first?`;
          return (
            <div className="h-full flex flex-col">
                <div className="mb-2">
                    <Button variant="link" size="sm" className="text-muted-foreground p-0 h-auto" onClick={() => {setSelectedTopic(null); setCurrentStep("selectTopic")}}>
                        &larr; Back to Topics in {selectedLesson.name}
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
                        <Lightbulb className="mr-3 h-8 w-8 text-accent"/> Study: {selectedTopic.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">Subject: {subjectName} &gt; Lesson: {selectedLesson.name}</p>
                </div>
                 <div className="flex-grow min-h-0">
                    <ChatInterface
                    userProfile={profile}
                    topic={selectedTopic.name} // Most specific topic for the chat
                    conversationId={conversationId}
                    initialSystemMessage={initialMessage}
                    placeholderText={`Ask about ${selectedTopic.name}...`}
                    context={{ subject: subjectName, lesson: selectedLesson.name }}
                    />
                </div>
            </div>
          );
        }
        return <p>Error: Topic not selected.</p>; // Should not happen
      default:
        return <p>Loading or invalid state...</p>;
    }
  }

  return (
    <div className="h-full flex flex-col p-1 sm:p-2 md:p-0">
        {currentStep !== 'chat' && (
             <div className="mb-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center">
                    <BookOpen className="mr-3 h-8 w-8"/> Study Session: {subjectName}
                </h1>
             </div>
        )}
        <div className="flex-grow min-h-0"> {/* Ensure this div can shrink and grow */}
            {renderStepContent()}
        </div>
    </div>
  );
}

