"use client";

import React, { useState, useEffect } from 'react';
import type { MCQItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Lightbulb, RotateCcw, HelpCircle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface McqQuizzerProps {
  mcqs: MCQItem[];
  onReset: () => void;
  documentName: string;
}

const McqQuizzer: React.FC<McqQuizzerProps> = ({ mcqs, onReset, documentName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentMcq = mcqs[currentIndex];

  useEffect(() => {
    // Reset state when mcqs change (e.g., new set loaded)
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setShowExplanation(false);
  }, [mcqs]);

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    setShowExplanation(false); // Hide previous explanation when submitting new
    if (selectedOption === currentMcq.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowExplanation(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setShowExplanation(false);
  };

  if (!mcqs || mcqs.length === 0) {
    return <p className="text-center text-muted-foreground">No MCQs to display.</p>;
  }

  const isQuizFinished = currentIndex === mcqs.length - 1 && isSubmitted;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl text-center text-gradient-primary">MCQ Quiz: "{documentName}"</CardTitle>
        {!isQuizFinished && (
          <div className="flex justify-between items-center text-sm mt-2">
             <CardDescription>Question {currentIndex + 1} of {mcqs.length}</CardDescription>
             <CardDescription>Score: {score}/{mcqs.length}</CardDescription>
          </div>
        )}
        <Progress value={((currentIndex + (isSubmitted ? 1:0)) / mcqs.length) * 100} className="w-full mt-2 h-2" />
      </CardHeader>

      <CardContent className="py-6 px-4 sm:px-6 min-h-[300px]">
        {!isQuizFinished ? (
          <>
            <p className="font-semibold text-lg sm:text-xl mb-6 text-foreground leading-relaxed">{currentMcq.question}</p>
            <RadioGroup
              value={selectedOption || undefined}
              onValueChange={(value) => !isSubmitted && setSelectedOption(value)}
              className="space-y-3"
            >
              {currentMcq.options.map((option, index) => {
                const isCorrect = option === currentMcq.correctAnswer;
                const isSelected = option === selectedOption;
                return (
                  <Label
                    key={index}
                    htmlFor={`option-${index}`}
                    className={cn(
                      "flex items-center p-3.5 rounded-md border cursor-pointer transition-all duration-200 ease-in-out hover:bg-muted/80",
                      isSubmitted && isCorrect && "bg-green-500/15 border-green-500 ring-2 ring-green-500/70",
                      isSubmitted && isSelected && !isCorrect && "bg-red-500/15 border-red-500 ring-2 ring-red-500/70",
                      isSubmitted && !isSelected && !isCorrect && "opacity-70",
                      !isSubmitted && isSelected && "bg-primary/10 border-primary",
                      !isSubmitted && "border-border"
                    )}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="mr-3 flex-shrink-0" disabled={isSubmitted} />
                    <span className={cn("flex-1 text-sm sm:text-base", isSubmitted && isCorrect && "font-semibold")}>{option}</span>
                    {isSubmitted && isSelected && isCorrect && <CheckCircle className="ml-3 h-5 w-5 text-green-600 flex-shrink-0" />}
                    {isSubmitted && isSelected && !isCorrect && <XCircle className="ml-3 h-5 w-5 text-red-600 flex-shrink-0" />}
                    {isSubmitted && !isSelected && isCorrect && <CheckCircle className="ml-3 h-5 w-5 text-green-500 opacity-70 flex-shrink-0" />}
                  </Label>
                );
              })}
            </RadioGroup>

            {isSubmitted && currentMcq.explanation && (
              <div className="mt-6 p-4 bg-accent/50 border border-accent rounded-md">
                <Button variant="link" className="p-0 h-auto text-sm text-accent-foreground hover:text-accent-foreground/80" onClick={() => setShowExplanation(!showExplanation)}>
                  <Lightbulb className="mr-2 h-4 w-4" /> {showExplanation ? "Hide" : "Show"} Explanation
                </Button>
                {showExplanation && <p className="text-xs sm:text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{currentMcq.explanation}</p>}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-primary mb-3">Quiz Completed!</h2>
            <p className="text-xl text-foreground mb-2">Your Final Score: <span className="font-bold">{score}</span> out of <span className="font-bold">{mcqs.length}</span></p>
            <p className="text-muted-foreground">({((score / mcqs.length) * 100).toFixed(0)}%)</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRestartQuiz} variant="default" className="shadow-md">
                <RotateCcw className="mr-2 h-4 w-4" /> Restart Quiz
              </Button>
              <Button onClick={onReset} variant="outline" className="shadow-sm">
                Use New Document
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {!isQuizFinished && (
        <CardFooter className="border-t pt-4 flex justify-end">
          {isSubmitted ? (
            <Button onClick={handleNextQuestion} className="shadow-md">
              Next Question <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmitAnswer} disabled={!selectedOption} className="shadow-md">
              Submit Answer
            </Button>
          )}
        </CardFooter>
      )}
       <style jsx global>{`
        /* You might want to add some subtle animations for feedback if desired */
      `}</style>
    </Card>
  );
};

export default McqQuizzer;
