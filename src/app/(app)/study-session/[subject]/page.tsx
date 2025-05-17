
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { Lesson, Topic, UserProfile as UserProfileType, Conversation } from "@/types";
import { getLessonsForSubject, GetLessonsForSubjectInput } from "@/ai/flows/get-lessons-for-subject";
import { getTopicsForLesson, GetTopicsForLessonInput } from "@/ai/flows/get-topics-for-lesson";
import { getConversationById } from "@/lib/chat-storage";
import { Loader2, AlertTriangle, ChevronRight, BookOpen, Lightbulb, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const DynamicChatInterface = dynamic(() =>
  import('../components/chat-interface').then((mod) => mod.ChatInterface),
  { 
    loading: () => <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false 
  }
);

type StudyStep = "selectLesson" | "selectTopic" | "chat" | "loading" | "error";

export default function StudySessionPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const subjectName = typeof params.subject === 'string' ? decodeURIComponent(params.subject) : "Selected Topic";

  const [currentStep, setCurrentStep] = useState<StudyStep>("loading");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revisitConversationId, setRevisitConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string | number>(Date.now());


  const fetchLessonsForSubject = useCallback(async (currentProfile: UserProfileType, currentSubjectName: string) => {
    setIsLoading(true); 
    setErrorMessage(null);
    try {
      const input: GetLessonsForSubjectInput = {
        subjectName: currentSubjectName,
        studentProfile: {
          ...currentProfile,
          age: Number(currentProfile.age) 
        } as UserProfileType & { age: number }, 
      };
      const result = await getLessonsForSubject(input);
      if (result && result.lessons && result.lessons.length > 0) {
        setLessons(result.lessons);
        return result.lessons;
      } else {
        setErrorMessage(`No lessons found for ${currentSubjectName}. Try another subject or use the General Tutor.`);
        setCurrentStep("error");
        return [];
      }
    } catch (e) {
      console.error("Failed to fetch lessons:", e);
      setErrorMessage("Failed to load lessons. Please try again or check your connection.");
      setCurrentStep("error");
      return [];
    } finally {
       
    }
  }, []);


  const fetchTopicsForLesson = useCallback(async (currentProfile: UserProfileType, currentSubjectName: string, lesson: Lesson) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
        const input: GetTopicsForLessonInput = {
        subjectName: currentSubjectName,
        lessonName: lesson.name,
        studentProfile: {
          ...currentProfile,
          age: Number(currentProfile.age)
        } as UserProfileType & { age: number },
        };
        const result = await getTopicsForLesson(input);
        if (result && result.topics && result.topics.length > 0) {
          setTopics(result.topics);
          return result.topics;
        } else {
          setErrorMessage(`No topics found for lesson "${lesson.name}". Please select another lesson or go back.`);
          setCurrentStep("error"); 
          return [];
        }
    } catch (e) {
        console.error("Failed to fetch topics:", e);
        setErrorMessage("Failed to load topics. Please try again.");
        setCurrentStep("error");
        return [];
    } finally {
        
    }
  }, []);


  useEffect(() => {
    if (!profileLoading && profile && subjectName) {
      const sessionIdParam = searchParams.get('sessionId');
      const lessonParam = searchParams.get('lesson');
      const topicParam = searchParams.get('topic');

      if (sessionIdParam && lessonParam && topicParam) {
        
        setRevisitConversationId(sessionIdParam);
        setChatKey(sessionIdParam);
        
        const conversation = getConversationById(sessionIdParam);
        if (conversation && 
            decodeURIComponent(params.subject as string) === conversation.subjectContext &&
            lessonParam === conversation.lessonContext &&
            topicParam === conversation.topic) {

            setSelectedLesson({ name: conversation.lessonContext, description: "Revisiting session" });
            setSelectedTopic({ name: conversation.topic, description: "Revisiting session" });
            setCurrentStep("chat");
            
            return; 
        } else {
            
            console.warn("Revisit parameters do not match stored conversation or conversation not found. Proceeding to selection.");
        }
      }

      
      setCurrentStep("loading");
      fetchLessonsForSubject(profile, subjectName).then(fetchedLessons => {
        if (fetchedLessons.length > 0) {
          setCurrentStep("selectLesson");
        }
      });

    } else if (!profileLoading && !profile) {
        setCurrentStep("error"); 
        setErrorMessage("User profile not found. Please complete onboarding.");
    }
  }, [profile, profileLoading, subjectName, params.subject, searchParams, fetchLessonsForSubject]);


  const handleSelectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentStep("loading");
    if(profile){
       fetchTopicsForLesson(profile, subjectName, lesson).then(fetchedTopics => {
           if (fetchedTopics.length > 0) {
               setCurrentStep("selectTopic");
           }
       });
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    const newConversationId = `study-session-${profile?.id || 'default'}-${subjectName.replace(/\s+/g, '_')}-${selectedLesson?.name.replace(/\s+/g, '_')}-${topic.name.replace(/\s+/g, '_')}`.toLowerCase();
    setRevisitConversationId(newConversationId); 
    setChatKey(newConversationId);
    setCurrentStep("chat");
  };
  
  const handleRetry = () => {
    if (profile && subjectName) {
        if (selectedLesson && currentStep === "error" && errorMessage?.includes("topics")) {
            fetchTopicsForLesson(profile, subjectName, selectedLesson);
        } else {
            fetchLessonsForSubject(profile, subjectName).then(fetchedLessons => {
                if(fetchedLessons.length > 0) setCurrentStep("selectLesson");
            });
        }
    }
  };


  if (profileLoading || (currentStep === "loading" && !errorMessage)) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-0 mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading study materials for {subjectName}...</p>
      </div>
    );
  }

  if (!profile && !profileLoading) { 
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 pt-0 mt-0">
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
      <div className="flex flex-col items-center justify-center h-full pt-0 mt-0">
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
            <CardHeader className="pt-0">
              <CardTitle className="text-xl sm:text-2xl mt-0">Choose a Lesson in {subjectName}</CardTitle>
              <CardDescription>Select a lesson to see its topics.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
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
            <CardHeader className="pt-0">
              <CardTitle className="text-xl sm:text-2xl mt-0">Choose a Topic in {selectedLesson?.name}</CardTitle>
              <CardDescription>Select a topic to start your Q&amp;A session.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-22rem)] pr-4"> 
                <div className="space-y-3">
                  {topics.map((topic, idx) => (
                    <Button key={idx} variant="outline" className="w-full justify-between text-left h-auto py-3 px-4 group" onClick={() => handleSelectTopic(topic)}>
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
                <Button variant="ghost" onClick={() => {setSelectedTopic(null); setTopics([]); setCurrentStep("selectLesson");}}>Back to Lessons</Button>
            </CardFooter>
          </Card>
        );
      case "chat":
        if (selectedTopic && selectedLesson && profile && revisitConversationId) {
          const initialMessage = `Hello ${profile.name}! Let's start our Q&A session on "${selectedTopic.name}" from the lesson "${selectedLesson.name}" in "${subjectName}". What aspect of "${selectedTopic.name}" would you like to explore first?`;
          return (
            <div className="h-full flex flex-col">
                <div className="mb-2 pt-0">
                    <Button variant="link" size="sm" className="text-muted-foreground p-0 h-auto" onClick={() => {
                        setSelectedTopic(null); 
                        setRevisitConversationId(null); 
                        setChatKey(Date.now()); 
                        setCurrentStep("selectTopic");
                        
                        if(profile && selectedLesson) fetchTopicsForLesson(profile, subjectName, selectedLesson);
                      }}>
                        &larr; Back to Topics in {selectedLesson.name}
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
                        <Lightbulb className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-accent"/> Study: {selectedTopic.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">Subject: {subjectName} &gt; Lesson: {selectedLesson.name}</p>
                </div>
                 <div className="flex-grow min-h-0">
                    <DynamicChatInterface
                    key={chatKey} 
                    userProfile={profile}
                    topic={selectedTopic.name} 
                    conversationId={revisitConversationId} 
                    initialSystemMessage={initialMessage}
                    placeholderText={`Ask about ${selectedTopic.name}...`}
                    context={{ subject: subjectName, lesson: selectedLesson.name }}
                    />
                </div>
            </div>
          );
        }
        return <p>Error: Chat session details are incomplete.</p>; 
      default:
        return <p>Loading or invalid state...</p>;
    }
  }

  return (
    <div className="h-full flex flex-col p-1 sm:p-2 md:p-0 mt-0 pt-0">
        {currentStep !== 'chat' && (
             <div className="mb-4 text-center pt-0 mt-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center justify-center mt-0">
                    <BookOpen className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/> Study Session: {subjectName}
                </h1>
             </div>
        )}
        <div className="flex-grow min-h-0"> 
            {renderStepContent()}
        </div>
    </div>
  );
}
