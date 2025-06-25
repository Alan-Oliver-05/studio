
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LANGUAGES } from '@/lib/constants';
import type { ConversationSetupParams } from '@/types';
import { Bot, User, BarChartHorizontalBig, Sparkles, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


interface ConversationPracticeSetupProps {
  onSetupComplete: (params: ConversationSetupParams) => void;
  userPreferredLanguage: string;
}

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

const LanguageCombobox = ({
  label,
  value,
  onValueChange,
  icon: Icon
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  icon: React.ElementType;
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() =>
    LANGUAGES.filter(lang =>
      lang.label.toLowerCase().includes(search.toLowerCase())
    ), [search]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`${label}-language`} className="flex items-center">
        <Icon className="w-4 h-4 mr-1.5 text-primary"/> {label}
      </Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-10 font-normal">
            <span className="truncate">
              {value ? LANGUAGES.find(lang => lang.value === value)?.label : "Select language..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <div className="p-2 border-b">
            <Input placeholder="Search language..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9"/>
          </div>
          <ScrollArea className="h-60">
            <div className="p-1">
              {filteredLanguages.length > 0 ? filteredLanguages.map((language) => (
                <Button variant="ghost" key={language.value} onClick={() => { onValueChange(language.value); setPopoverOpen(false); setSearch(""); }} className="w-full justify-start font-normal text-sm h-9">
                  <Check className={cn("mr-2 h-4 w-4", value === language.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{language.label}</span>
                </Button>
              )) : (
                <p className="p-2 text-center text-sm text-muted-foreground">No language found.</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ConversationPracticeSetup: React.FC<ConversationPracticeSetupProps> = ({ onSetupComplete, userPreferredLanguage }) => {
  const [scenario, setScenario] = useState(predefinedScenarios[0]);
  const [customScenario, setCustomScenario] = useState("");
  const [userLanguage, setUserLanguage] = useState(userPreferredLanguage || 'en');
  const [aiLanguage, setAiLanguage] = useState('fr');
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
          <LanguageCombobox
            label="I will speak:"
            value={userLanguage}
            onValueChange={setUserLanguage}
            icon={User}
          />
          <LanguageCombobox
            label="AI will speak:"
            value={aiLanguage}
            onValueChange={setAiLanguage}
            icon={Bot}
          />
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
