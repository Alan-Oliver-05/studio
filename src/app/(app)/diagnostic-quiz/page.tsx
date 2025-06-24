
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, FileQuestion, Lightbulb, CheckCircle, XCircle, BarChartHorizontalBig, Percent, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { DiagnosticQuizItem, GenerateDiagnosticQuizInput, GenerateDiagnosticQuizOutput } from '@/types';
import { generateDiagnosticQuiz } from '@/ai/flows/generate-diagnostic-quiz-flow';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/contexts/user-profile-context';
import Link from "next/link";


type QuizState = "initial" | "generating" | "taking" | "results" | "error";

export default function DiagnosticQuizPage() {
  const [domain, setDomain] = useState<string>("");
  const [numItems, setNumItems] = useState<number>(5);
  const [quizData, setQuizData] = useState<GenerateDiagnosticQuizOutput | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>("initial");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const handleGenerateQuiz = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!domain.trim()) {
      toast({ title: "Domain Required", description: "Please enter a subject or domain for the quiz.", variant: "destructive" });
      return;
    }
    if (numItems < 3 || numItems > 15) {
        toast({ title: "Invalid Number of Questions", description: "Please enter a number between 3 and 15.", variant: "destructive" });
        return;
    }
    setQuizState("generating");
    setError(null);
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const input: GenerateDiagnosticQuizInput = { domain, numItems };
      const result = await generateDiagnosticQuiz(input);
      if (result && result.quizItems && result.quizItems.length > 0) {
        setQuizData(result);
        setQuizState("taking");
        toast({ title: "Quiz Generated!", description: `Your ${result.quizTitle} is ready.` });
      } else {
        throw new Error("AI did not return any quiz items.");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate quiz: ${errorMessage}`);
      setQuizState("error");
      toast({ title: "Quiz Generation Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  
  const handleNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.quizItems.length - 1) {
        if (userAnswers[currentQuestionIndex] === undefined) {
            toast({title: "Answer Required", description: "Please select an answer before proceeding.", variant: "default"});
            return;
        }
        setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    if (userAnswers[currentQuestionIndex] === undefined && currentQuestionIndex === quizData.quizItems.length -1) {
        toast({title: "Answer Required", description: "Please select an answer for the last question.", variant: "default"});
        return;
    }

    let calculatedScore = 0;
    quizData.quizItems.forEach((item, index) => {
      if (userAnswers[index] === item.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setQuizState("results");
    toast({ title: "Quiz Submitted!", description: `You scored ${calculatedScore} out of ${quizData.quizItems.length}.` });
  };

  const handleRestartQuiz = () => {
    setDomain("");
    setNumItems(5);
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState("initial");
    setError(null);
  };
  
  const bloomLevelColors: Record<string, string> = {
    remember: "bg-blue-100 text-blue-700 border-blue-300",
    apply: "bg-green-100 text-green-700 border-green-300",
    analyze: "bg-yellow-100 text-yellow-700 border-yellow-300",
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-0 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Diagnostic Quiz Tool...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0 pt-0">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Diagnostic Quiz, we need your profile information. Please complete the onboarding process first.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  const currentQuestionData = quizData?.quizItems[currentQuestionIndex];

  return (
    <div className="pb-8 pt-0">
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary flex items-center justify-center">
          <FileQuestion className="mr-3 h-8 w-8 sm:h-10 sm:w-10 text-accent" /> Diagnostic Quiz Generator
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Assess your understanding of a subject with an AI-generated quiz.
        </p>
      </div>

      {quizState === "initial" && (
        <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Start a New Quiz</CardTitle>
            <CardDescription>Enter the subject and number of questions for your diagnostic quiz.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerateQuiz}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domain" className="mb-1 block">Subject / Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="E.g., High School Algebra, World History"
                />
              </div>
              <div>
                <Label htmlFor="numItems" className="mb-1 block">Number of Questions (3-15)</Label>
                <Input
                  id="numItems"
                  type="number"
                  value={numItems}
                  onChange={(e) => setNumItems(Math.max(3, Math.min(15, parseInt(e.target.value, 10) || 3)))}
                  min="3" max="15"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full shadow-md" size="lg">
                <Sparkles className="mr-2 h-5 w-5" /> Generate Quiz
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {quizState === "generating" && (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <p className="text-xl font-semibold text-muted-foreground">AI is crafting your quiz on "{domain}"...</p>
        </div>
      )}

      {quizState === "error" && error && (
        <Alert variant="destructive" className="max-w-lg mx-auto shadow-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Quiz Generation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={handleRestartQuiz} variant="secondary" className="mt-4">Try Again</Button>
        </Alert>
      )}

      {quizState === "taking" && quizData && currentQuestionData && (
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gradient-primary">{quizData.quizTitle}</CardTitle>
            <div className="flex justify-between items-center text-sm mt-1">
                <CardDescription>Question {currentQuestionIndex + 1} of {quizData.quizItems.length}</CardDescription>
                <div className="flex gap-2">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full border font-medium", bloomLevelColors[currentQuestionData.bloomLevel])}>
                        {currentQuestionData.bloomLevel.charAt(0).toUpperCase() + currentQuestionData.bloomLevel.slice(1)}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full border border-primary/30 bg-primary/10 text-primary font-medium">
                        Difficulty: {currentQuestionData.difficulty}/5
                    </span>
                </div>
            </div>
            <Progress value={((currentQuestionIndex) / quizData.quizItems.length) * 100} className="w-full mt-2 h-2" />
          </CardHeader>
          <CardContent className="py-5">
            <p className="font-semibold text-lg mb-6 text-foreground leading-relaxed">{currentQuestionData.question}</p>
            <RadioGroup
              value={userAnswers[currentQuestionIndex]}
              onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, value)}
              className="space-y-3"
            >
              {currentQuestionData.options.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`option-${index}`}
                  className={cn(
                    "flex items-center p-3.5 rounded-md border cursor-pointer transition-all duration-200 ease-in-out hover:bg-muted/80",
                     userAnswers[currentQuestionIndex] === option ? "bg-primary/10 border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} className="mr-3 flex-shrink-0" />
                  <span className="flex-1 text-sm sm:text-base">{option}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between pt-5 border-t">
            <Button variant="outline" onClick={handleRestartQuiz} className="shadow-sm">Start New Quiz</Button>
            {currentQuestionIndex < quizData.quizItems.length - 1 ? (
              <Button onClick={handleNextQuestion} disabled={userAnswers[currentQuestionIndex] === undefined} className="shadow-md">
                Next Question <ChevronRight className="ml-2 h-4 w-4"/>
              </Button>
            ) : (
              <Button onClick={handleSubmitQuiz} disabled={userAnswers[currentQuestionIndex] === undefined} className="shadow-md bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-5 w-5"/> Submit Quiz
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      {quizState === "results" && quizData && (
        <Card className="w-full max-w-3xl mx-auto shadow-xl border-green-500/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl sm:text-3xl text-gradient-primary">Quiz Results: {quizData.quizTitle}</CardTitle>
            <CardDescription className="text-lg">
              You scored: <span className="font-bold text-primary">{score}</span> out of <span className="font-bold">{quizData.quizItems.length}</span> 
              ({((score / quizData.quizItems.length) * 100).toFixed(0)}%)
            </CardDescription>
             <Progress value={ (score / quizData.quizItems.length) * 100 } color="bg-green-500" className="w-3/4 mx-auto mt-3 h-3"/>
          </CardHeader>
          <CardContent className="space-y-6 py-5 px-4 sm:px-6 max-h-[calc(100vh-25rem)] overflow-y-auto scrollbar-thin">
            {quizData.quizItems.map((item, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === item.correctAnswer;
              return (
                <div key={index} className={cn("p-4 border rounded-lg", isCorrect ? "border-green-500/70 bg-green-500/10" : "border-destructive/70 bg-destructive/10")}>
                  <p className="font-semibold text-md mb-1">{index + 1}. {item.question}</p>
                  <div className="space-y-1.5 text-sm mb-2">
                    {item.options.map(opt => (
                        <p key={opt} className={cn(
                            "flex items-center",
                            opt === item.correctAnswer && "font-semibold text-green-700 dark:text-green-400",
                            opt === userAnswer && !isCorrect && "font-semibold text-destructive dark:text-red-400 line-through",
                            opt !== item.correctAnswer && opt !== userAnswer && "text-muted-foreground"
                        )}>
                            {opt === item.correctAnswer && <CheckCircle className="h-4 w-4 mr-1.5 text-green-600 flex-shrink-0"/>}
                            {opt === userAnswer && !isCorrect && <XCircle className="h-4 w-4 mr-1.5 text-destructive flex-shrink-0"/>}
                            {! (opt === item.correctAnswer || (opt === userAnswer && !isCorrect)) && <BarChartHorizontalBig className="h-4 w-4 mr-1.5 opacity-0 flex-shrink-0"/>}
                           {opt}
                        </p>
                    ))}
                  </div>
                  <p className={cn("text-xs font-medium mb-1.5", isCorrect ? "text-green-700 dark:text-green-500" : "text-red-700 dark:text-red-500")}>
                    Your answer: {userAnswer || "Not answered"} - {isCorrect ? "Correct!" : "Incorrect."}
                  </p>
                  <div className="text-xs p-2.5 bg-card/50 rounded-md border border-border/50">
                    <span className="font-semibold text-primary flex items-center"><Lightbulb className="h-3.5 w-3.5 mr-1"/> Explanation:</span>
                    <span className="ml-1 text-muted-foreground">{item.explanation}</span>
                  </div>
                   <div className="mt-2 flex gap-2 text-xs">
                        <span className={cn("px-1.5 py-0.5 rounded-full border font-medium text-[10px]", bloomLevelColors[item.bloomLevel])}>
                           {item.bloomLevel.charAt(0).toUpperCase() + item.bloomLevel.slice(1)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary font-medium text-[10px]">
                            Diff: {item.difficulty}/5
                        </span>
                    </div>
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="flex justify-center pt-5 border-t">
            <Button onClick={handleRestartQuiz} className="shadow-md" size="lg">
                <Sparkles className="mr-2 h-5 w-5"/> Take New Quiz
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
