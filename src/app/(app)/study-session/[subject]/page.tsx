
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { Lesson, Topic, UserProfile as UserProfileType, Conversation, Message as MessageType, QAS_Stage, InteractiveQAndAInput } from "@/types";
import { getLessonsForSubject, GetLessonsForSubjectInput } from "@/ai/flows/get-lessons-for-subject";
import { getTopicsForLesson, GetTopicsForLessonInput } from "@/ai/flows/get-topics-for-lesson";
import { getConversationById, addMessageToConversation } from "@/lib/chat-storage";
import { interactiveQAndA } from "@/ai/flows/interactive-q-and-a";
import { Loader2, AlertTriangle, ChevronRight, BookOpen, Lightbulb, CheckCircle, ChevronLeft, RefreshCw, Home, FolderOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DynamicChatInterface = dynamic(async () =>
  import('../components/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
    ssr: false
  }
);

type StudyStep = "selectLesson" | "selectTopic" | "chat" | "loading" | "error" | "fetchingFirstQuestion";

export default function StudySessionPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const subjectName = typeof params.subject === 'string' ? decodeURIComponent(params.subject) : "Selected Subject";

  const [currentStep, setCurrentStep] = useState<StudyStep>("loading");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString());

  const [initialQAStageForChat, setInitialQAStageForChat] = useState<QAS_Stage>('initial_material');
  const [initialQuestionsInStageForChat, setInitialQuestionsInStageForChat] = useState<number>(0);


  const fetchLessonsForSubject = useCallback(async (currentProfile: UserProfileType, currentSubjectName: string) => {
    setCurrentStep("loading");
    setErrorMessage(null);
    try {
      const input: GetLessonsForSubjectInput = {
        subjectName: currentSubjectName,
        studentProfile: {
          ...currentProfile,
          age: Number(currentProfile.age)
        },
      };
      const result = await getLessonsForSubject(input);
      if (result && result.lessons && result.lessons.length > 0) {
        setLessons(result.lessons);
        return result.lessons;
      } else {
        setErrorMessage(`No lessons found for "${currentSubjectName}". You can try the General Tutor or go back to dashboard.`);
        setCurrentStep("error");
        return [];
      }
    } catch (e) {
      console.error("Failed to fetch lessons:", e);
      setErrorMessage("Failed to load lessons. Please try again or check your connection.");
      setCurrentStep("error");
      return [];
    }
  }, []);


  const fetchTopicsForLesson = useCallback(async (currentProfile: UserProfileType, currentSubjectName: string, lesson: Lesson) => {
    setCurrentStep("loading");
    setErrorMessage(null);
    try {
        const input: GetTopicsForLessonInput = {
        subjectName: currentSubjectName,
        lessonName: lesson.name,
        studentProfile: {
          ...currentProfile,
          age: Number(currentProfile.age)
        },
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
    }
  }, []);


  const startInteractiveQASession = useCallback(async (profileData: UserProfileType, subjName: string, less: Lesson, top: Topic, convoId: string, initialStage: QAS_Stage, initialQuestionsAsked: number) => {
    setErrorMessage(null);
    setCurrentStep("fetchingFirstQuestion");
    try {
      const qAndAInput: InteractiveQAndAInput = {
        studentProfile: {
          name: profileData.name,
          age: Number(profileData.age),
          country: profileData.country,
          preferredLanguage: profileData.preferredLanguage,
          learningStyle: profileData.learningStyle,
          educationQualification: profileData.educationQualification ? {
            boardExam: profileData.educationQualification.boardExams,
            competitiveExam: profileData.educationQualification.competitiveExams,
            universityExam: profileData.educationQualification.universityExams,
          } : undefined,
        },
        subject: subjName,
        lesson: less.name,
        topic: top.name,
        currentStage: initialStage,
        questionsAskedInStage: initialQuestionsAsked,
      };

      const result = await interactiveQAndA(qAndAInput);
      if (result && result.question) {
        const aiMessage: MessageType = {
          id: crypto.randomUUID(),
          sender: "ai" as const,
          text: result.question,
          feedback: result.feedback,
          isCorrect: result.isCorrect,
          suggestions: result.suggestions,
          timestamp: Date.now(),
          aiNextStage: result.nextStage,
          aiIsStageComplete: result.isStageComplete,
        };
        addMessageToConversation(convoId, top.name, aiMessage, profileData, subjName, less.name);
        
        setInitialQAStageForChat(result.nextStage || initialStage);
        setInitialQuestionsInStageForChat( (result.isStageComplete && result.nextStage !== initialStage) ? 0 : (result.nextStage === initialStage ? 1: 0)); 

        if (result.nextStage === 'completed' && result.isStageComplete) {
            toast({ title: "Topic Session Note", description: `AI indicates the Q&A for ${top.name} might be brief or complete.`, duration: 4000 });
        }
        setCurrentStep("chat");
      } else {
        throw new Error("AI did not provide an initial question for the Q&A session.");
      }
    } catch (e) {
      console.error("Failed to fetch initial Q&A question:", e);
      toast({ title: "Error Starting Q&A", description: "Failed to get the first question from AI. You can try asking first in the chat.", variant: "destructive" });
      setInitialQAStageForChat(initialStage); 
      setInitialQuestionsInStageForChat(initialQuestionsAsked);
      setCurrentStep("chat"); 
    }
  }, [toast]);

  useEffect(() => {
    if (!profileLoading && profile && subjectName) {
      const sessionIdFromQuery = searchParams.get('sessionId');

      if (sessionIdFromQuery) {
        const conversation = getConversationById(sessionIdFromQuery);
        const specialModes = ["AI Learning Assistant Chat", "Homework Help", "Visual Learning Focus", "LanguageTranslatorMode", "Language Text Translation", "Language Voice Translation", "Language Conversation Practice", "Language Camera Translation"];
        
        if (conversation && conversation.subjectContext === subjectName && conversation.lessonContext && conversation.topic && !specialModes.includes(conversation.topic)) {
          setSelectedLesson({ name: conversation.lessonContext, description: "Revisiting session" });
          setSelectedTopic({ name: conversation.topic, description: "Revisiting session" });
          setCurrentConversationId(sessionIdFromQuery);
          setChatKey(sessionIdFromQuery);

          const lastAiMsg = [...conversation.messages].reverse().find(m => m.sender === 'ai');
          if (lastAiMsg?.aiNextStage) {
            const restoredStage = lastAiMsg.aiNextStage;
            setCurrentClientStage(restoredStage);
            
            let answeredCount = 0;
            const lastUserMsgIndex = findLastIndex(conversation.messages, m => m.sender === 'user');
            const lastAIMsgIndex = findLastIndex(conversation.messages, m => m.sender === 'ai');

            if (lastAIMsgIndex > -1 && lastAIMsgIndex > lastUserMsgIndex && lastAiMsg.aiIsStageComplete) {
               answeredCount = 0;
            } else {
              let aiQuestionForStagePending: MessageType | null = null;
              for (const msg of conversation.messages) {
                  if (msg.sender === 'ai' && msg.aiNextStage === restoredStage && !msg.aiIsStageComplete) {
                      aiQuestionForStagePending = msg;
                  } else if (msg.sender === 'user' && aiQuestionForStagePending && msg.timestamp > aiQuestionForStagePending.timestamp) {
                      const aiMsgIndex = conversation.messages.indexOf(aiQuestionForStagePending);
                      const userMsgIndex = conversation.messages.indexOf(msg);
                      if (userMsgIndex > aiMsgIndex) { 
                           answeredCount++;
                      }
                      aiQuestionForStagePending = null; 
                  }
              }
            }
            setInitialQuestionsInStageForChat(answeredCount);

            if (restoredStage === 'completed' && lastAiMsg.aiIsStageComplete) {
              setIsTopicSessionCompleted(true);
            } else {
              setIsTopicSessionCompleted(false);
            }
          } else { 
            setInitialQAStageForChat('initial_material');
            setInitialQuestionsInStageForChat(0);
            setIsTopicSessionCompleted(false);
          }
          setCurrentStep("chat");
          return;
        } else {
          router.replace(`/study-session/${encodeURIComponent(subjectName)}`, { scroll: false });
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
        setErrorMessage("User profile not found. Please complete onboarding to start a study session.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading, subjectName, searchParams, router]);


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
    if (!profile || !selectedLesson) return;
    setSelectedTopic(topic);
    
    const profileIdentifier = profile.id || profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous';
    const newConvoId = `studies-interactiveqa-${profileIdentifier}-${subjectName.replace(/\s+/g, '_')}-${selectedLesson.name.replace(/\s+/g, '_')}-${topic.name.replace(/\s+/g, '_')}-${Date.now()}`.toLowerCase();

    setCurrentConversationId(newConvoId);
    setChatKey(newConvoId); 
    startInteractiveQASession(profile, subjectName, selectedLesson, topic, newConvoId, 'initial_material', 0);
  };

  const handleRetry = () => {
    if (profile && subjectName) {
        if (selectedLesson && currentStep === "error" && errorMessage?.includes("topics")) {
            setCurrentStep("loading");
            fetchTopicsForLesson(profile, subjectName, selectedLesson).then(fetchedTopics => {
                 if(fetchedTopics.length > 0) setCurrentStep("selectTopic");
            });
        } else {
            setCurrentStep("loading");
            fetchLessonsForSubject(profile, subjectName).then(fetchedLessons => {
                if(fetchedLessons.length > 0) setCurrentStep("selectLesson");
            });
        }
    }
  };

  const handleNewChatForCurrentTopic = () => {
    if (!profile || !selectedLesson || !selectedTopic) return;
    const profileIdentifier = profile.id || profile.name?.replace(/\s+/g, '-').toLowerCase() || 'anonymous';
    const newConvoId = `studies-interactiveqa-${profileIdentifier}-${subjectName.replace(/\s+/g, '_')}-${selectedLesson.name.replace(/\s+/g, '_')}-${selectedTopic.name.replace(/\s+/g, '_')}-${Date.now()}`.toLowerCase();
    setCurrentConversationId(newConvoId);
    setChatKey(newConvoId); 
    startInteractiveQASession(profile, subjectName, selectedLesson, selectedTopic, newConvoId, 'initial_material', 0);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setCurrentConversationId(null); 
    setChatKey(`topics-${selectedLesson?.name.replace(/\s+/g, '_') || Date.now()}`); 
    setCurrentStep("selectTopic");
  };

  const handleBackToLessons = () => {
    setSelectedLesson(null);
    setSelectedTopic(null);
    setTopics([]); 
    setCurrentConversationId(null); 
    setChatKey(`lessons-${subjectName.replace(/\s+/g, '_') || Date.now()}`); 
    setCurrentStep("selectLesson");
  };


  if (profileLoading || (currentStep === "loading" && !errorMessage)) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading study materials for {subjectName}...</p>
      </div>
    );
  }

  if (!profile && !profileLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 pt-0">
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
      <div className="flex flex-col items-center justify-center h-full pt-0">
        <Alert variant="destructive" className="max-w-lg text-center shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-6 space-x-4">
            <Button onClick={handleRetry} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
            </Button>
            <Button variant="outline" asChild>
                <Link href="/dashboard"><Home className="mr-2 h-4 w-4"/>Back to Dashboard</Link>
            </Button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "selectLesson":
        return (
          <Card className="w-full max-w-3xl mx-auto shadow-xl border-border/60">
            <CardHeader className="pt-5 pb-4">
              <CardTitle className="text-xl sm:text-2xl mt-0 text-gradient-primary">Choose a Lesson in {subjectName}</CardTitle>
              <CardDescription>Select a lesson to dive into its topics and begin learning.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <ScrollArea className="h-[calc(100vh-26rem)] pr-3">
                <div className="space-y-2.5">
                  {lessons.map((lesson, idx) => (
                    <Card 
                      key={idx}
                      className="group hover:shadow-md hover:border-primary/50 transition-all duration-200 ease-in-out cursor-pointer"
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <p className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">{lesson.name}</p>
                          {lesson.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.description}</p>}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-0.5" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-primary">
                  <ChevronLeft className="mr-1 h-4 w-4"/> Back to Dashboard
                </Button>
            </CardFooter>
          </Card>
        );
      case "selectTopic":
        return (
          <Card className="w-full max-w-3xl mx-auto shadow-xl border-border/60">
            <CardHeader className="pt-5 pb-4">
              <CardTitle className="text-xl sm:text-2xl mt-0 text-gradient-primary">Choose a Topic in "{selectedLesson?.name}"</CardTitle>
              <CardDescription>Select a specific topic to start your interactive Q&amp;A session.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <ScrollArea className="h-[calc(100vh-26rem)] pr-3">
                <div className="space-y-2.5">
                  {topics.map((topic, idx) => (
                    <Card 
                      key={idx}
                      className="group hover:shadow-md hover:border-primary/50 transition-all duration-200 ease-in-out cursor-pointer"
                      onClick={() => handleSelectTopic(topic)}
                    >
                      <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <p className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">{topic.name}</p>
                          {topic.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topic.description}</p>}
                        </div>
                        <CheckCircle className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-between">
                <Button variant="ghost" onClick={handleBackToLessons} className="text-muted-foreground hover:text-primary">
                  <ChevronLeft className="mr-1 h-4 w-4"/> Back to Lessons
                </Button>
            </CardFooter>
          </Card>
        );
      case "fetchingFirstQuestion":
        return (
          <div className="flex flex-col items-center justify-center h-full pt-0">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Starting interactive Q&A for "{selectedTopic?.name || 'the selected topic'}"...</p>
            {errorMessage && <p className="text-destructive mt-4">{errorMessage}</p>}
          </div>
        );
      case "chat":
        if (selectedTopic && selectedLesson && profile && currentConversationId && chatKey) {
          return (
            <div className="h-full flex flex-col">
                <div className="mb-3 px-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="mb-2 sm:mb-0 flex-grow min-w-0">
                            <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary p-0 h-auto text-xs sm:text-sm mb-1 hover:no-underline" onClick={handleBackToTopics}>
                                <ChevronLeft className="mr-0.5 h-3 w-3 sm:h-4 sm:w-4"/> Back to Topics in "{selectedLesson.name}"
                            </Button>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center truncate">
                                <Lightbulb className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-accent flex-shrink-0"/> 
                                <span className="truncate" title={selectedTopic.name}>Interactive Q&A: {selectedTopic.name}</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                <span title={subjectName}>Subject: {subjectName}</span> &gt; <span title={selectedLesson.name}>Lesson: {selectedLesson.name}</span>
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleNewChatForCurrentTopic} className="self-start sm:self-center mt-1 sm:mt-0">
                            <RefreshCw className="mr-2 h-4 w-4"/> New Q&A on This Topic
                        </Button>
                    </div>
                </div>
                 <div className="flex-grow min-h-0 max-w-4xl w-full mx-auto">
                    { chatKey && currentConversationId && (
                        <DynamicChatInterface
                        key={chatKey} 
                        userProfile={profile}
                        topic={selectedTopic.name} 
                        conversationId={currentConversationId}
                        placeholderText={`Your answer or question about ${selectedTopic.name}...`}
                        context={{ subject: subjectName, lesson: selectedLesson.name }}
                        enableImageUpload={false} 
                        initialQAStage={initialQAStageForChat}
                        initialQuestionsInStage={initialQuestionsInStageForChat}
                        />
                    )}
                </div>
            </div>
          );
        }
        return <p className="text-center text-destructive mt-10">Error: Chat session details are incomplete. Please try navigating again.</p>;
      default:
        return <p className="text-center text-muted-foreground mt-10">Loading or invalid state...</p>;
    }
  }

  return (
    <div className="h-full flex flex-col pt-0">
        {currentStep !== 'chat' && (
             <div className="mb-4 text-center pt-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center justify-center mt-0 text-gradient-primary">
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
