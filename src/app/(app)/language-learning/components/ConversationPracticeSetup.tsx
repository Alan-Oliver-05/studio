
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LANGUAGES } from '@/lib/constants';
import type { ConversationSetupParams } from '@/types';
import { Bot, User, BarChartHorizontalBig, Sparkles } from 'lucide-react';

interface ConversationPracticeSetupProps {
  onSetupComplete: (params: ConversationSetupParams) => void;
  userPreferredLanguage: string;
}

const commonLanguages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
];

const difficultyLevels: { value: ConversationSetupParams['difficulty'], label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const predefinedScenarios = [
    "Ordering food at a restaurant/cafe",
    "Asking for directions",
    "Shopping for clothes",
    "Booking a hotel room",
    "Introducing yourself and making small talk",
    "Discussing hobbies and interests",
    "Talking about daily routines",
    "A job interview",
    "Other (Describe below)"
];

const ConversationPracticeSetup: React.FC<ConversationPracticeSetupProps> = ({ onSetupComplete, userPreferredLanguage }) => {
  const [scenario, setScenario] = useState(predefinedScenarios[0]);
  const [customScenario, setCustomScenario] = useState("");
  const [userLanguage, setUserLanguage] = useState(userPreferredLanguage || commonLanguages[0].value);
  const [aiLanguage, setAiLanguage] = useState(commonLanguages.find(l => l.value !== userLanguage)?.value || commonLanguages[1].value);
  const [difficulty, setDifficulty] = useState<ConversationSetupParams['difficulty']>('intermediate');
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");

  const handleSubmit = () => {
    const finalScenario = scenario === "Other (Describe below)" ? customScenario : scenario;
    if (!finalScenario.trim()) {
      alert("Please describe the scenario."); // Simple validation, can be improved with toast
      return;
    }
    onSetupComplete({
      scenario: finalScenario,
      userLanguage,
      aiLanguage,
      difficulty,
      userRole: userRole.trim() || undefined,
      aiRole: aiRole.trim() || undefined,
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-border/70">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gradient-primary flex items-center justify-center">
            <Sparkles className="w-7 h-7 mr-2 text-accent"/> Setup Conversation Practice
        </CardTitle>
        <CardDescription>Define the roles and scenario for your practice session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="scenario-select">Scenario</Label>
           <Select onValueChange={setScenario} value={scenario}>
            <SelectTrigger id="scenario-select">
              <SelectValue placeholder="Select a scenario" />
            </SelectTrigger>
            <SelectContent>
              {predefinedScenarios.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {scenario === "Other (Describe below)" && (
            <Textarea
              id="custom-scenario"
              placeholder="E.g., Discussing a recent news article"
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="user-role">Your Role (Optional)</Label>
                <Input 
                    id="user-role" 
                    placeholder="E.g., Tourist, Student" 
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)} 
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="ai-role">AI's Role (Optional)</Label>
                <Input 
                    id="ai-role" 
                    placeholder="E.g., Shopkeeper, Teacher" 
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value)}
                />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
            <Label htmlFor="user-language" className="flex items-center"><User className="w-4 h-4 mr-1.5 text-primary"/> I will speak:</Label>
            <Select onValueChange={setUserLanguage} value={userLanguage}>
                <SelectTrigger id="user-language">
                <SelectValue placeholder="Select your language" />
                </SelectTrigger>
                <SelectContent>
                {LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>

            <div className="space-y-2">
            <Label htmlFor="ai-language" className="flex items-center"><Bot className="w-4 h-4 mr-1.5 text-accent"/> AI will speak:</Label>
            <Select onValueChange={setAiLanguage} value={aiLanguage}>
                <SelectTrigger id="ai-language">
                <SelectValue placeholder="Select AI's language" />
                </SelectTrigger>
                <SelectContent>
                {LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty" className="flex items-center"><BarChartHorizontalBig className="w-4 h-4 mr-1.5 text-yellow-500"/> Conversation Level:</Label>
          <Select onValueChange={(value) => setDifficulty(value as ConversationSetupParams['difficulty'])} value={difficulty}>
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyLevels.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full">Start Conversation Practice</Button>
      </CardFooter>
    </Card>
  );
};

export default ConversationPracticeSetup;
