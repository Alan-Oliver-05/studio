"use client";

import React, { useState, useEffect } from 'react';
import type { Flashcard } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Shuffle, RotateCcw, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onReset: () => void;
  documentName: string;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onReset, documentName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentFlashcards, setCurrentFlashcards] = useState<Flashcard[]>(flashcards);

  useEffect(() => {
    setCurrentFlashcards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleNext = () => {
    setIsFlipped(false); // Always show front of next card
    setTimeout(() => { // Allow card to flip back before changing content
      setCurrentIndex((prevIndex) => (prevIndex + 1) % currentFlashcards.length);
    }, 150);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
     setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + currentFlashcards.length) % currentFlashcards.length);
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
     setTimeout(() => {
      setCurrentFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    }, 150);
  };

  if (!currentFlashcards || currentFlashcards.length === 0) {
    return <p className="text-center text-muted-foreground">No flashcards to display.</p>;
  }

  const currentCard = currentFlashcards[currentIndex];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-xl sm:text-2xl text-gradient-primary">Flashcards for "{documentName}"</CardTitle>
        <CardDescription>
          Card {currentIndex + 1} of {currentFlashcards.length}. Click card to flip.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 px-4 min-h-[280px] sm:min-h-[320px]">
        <div
          className={cn(
            "relative w-full max-w-md h-52 sm:h-60 rounded-lg shadow-2xl cursor-pointer perspective group",
            "bg-card border border-border hover:shadow-primary/20 transition-shadow"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className={cn(
              "absolute inset-0 w-full h-full p-6 flex items-center justify-center text-center rounded-lg backface-hidden transition-transform duration-700 ease-in-out",
              "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground",
              isFlipped ? "transform-rotate-y-180" : ""
            )}
          >
            <p className="text-lg sm:text-xl font-semibold">{currentCard.front}</p>
          </div>
          <div
            className={cn(
              "absolute inset-0 w-full h-full p-6 flex items-center justify-center text-center rounded-lg backface-hidden transition-transform duration-700 ease-in-out overflow-y-auto",
              "bg-gradient-to-br from-secondary to-muted text-secondary-foreground",
              isFlipped ? "" : "transform-rotate-y-180"
            )}
          >
             <p className="text-base sm:text-lg whitespace-pre-wrap">{currentCard.back}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrevious} className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" onClick={handleNext} className="shadow-sm">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleShuffle} className="shadow-sm">
            <Shuffle className="mr-2 h-4 w-4" /> Shuffle
          </Button>
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground hover:text-primary">
            <RotateCcw className="mr-2 h-4 w-4" /> New Document
          </Button>
        </div>
      </CardFooter>
       {/* Basic CSS for flip effect - can be enhanced */}
      <style jsx global>{`
        .perspective { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .transform-rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </Card>
  );
};

export default FlashcardViewer;
