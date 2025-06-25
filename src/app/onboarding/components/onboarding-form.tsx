
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { UserProfile, EducationCategory, LearningStyle } from "@/types";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES, BOARD_STANDARDS, UNIVERSITY_YEARS, CENTRAL_BOARDS, COMPETITIVE_EXAM_TYPES_CENTRAL, COMPETITIVE_EXAM_TYPES_STATE, LEARNING_STYLES, PROFESSIONAL_CERTIFICATION_EXAMS, PROFESSIONAL_CERTIFICATION_STAGES } from "@/lib/constants";
import { ChevronLeft, ChevronRight, CheckCircle, CalendarIcon, Loader2, MessageSquare, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { generateOnboardingQuestions, GenerateOnboardingQuestionsInput } from "@/ai/flows/generate-onboarding-questions-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";


const onboardingSteps = [
  { id: "personal", title: "Personal Details" },
  { id: "location", title: "Location & Language" },
  { id: "learningStyle", title: "Learning Style" },
  { id: "educationCategory", title: "Education Focus" },
  { id: "educationDetails", title: "Education Details" },
  { id: "review", title: "Review & Complete" },
] as const;

type StepId = typeof onboardingSteps[number]["id"];

const PersonalDetailsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name cannot exceed 100 characters."}),
  age: z.coerce.number().min(5, { message: "Age must be at least 5." }).max(100, { message: "Age must be at most 100." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
});

const LocationLanguageSchema = z.object({
  country: z.string().min(1, { message: "Please select a country." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }).max(50, { message: "State cannot exceed 50 characters."}),
  preferredLanguage: z.string().min(1, { message: "Please select a preferred language." }),
});

const LearningStyleSchema = z.object({
  learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading_writing", "balanced", ""], {
    required_error: "Please select a learning style preference.",
  }).optional(),
});

const EducationCategorySchema = z.object({
    educationCategory: z.enum(["board", "competitive", "university", "other", ""], {
    required_error: "You need to select an education category.",
  }),
});

const EducationDetailsSchema = z.object({
  educationQualification: z.object({
    boardExams: z.object({
      board: z.string().optional(),
      standard: z.string().optional(),
      subjectSegment: z.string().optional(), 
    }).optional(),
    competitiveExams: z.object({
      examType: z.string().optional(), 
      specificExam: z.string().optional(),
      stage: z.string().optional(),
      examDate: z.date().optional().nullable(),
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional(),
      collegeName: z.string().optional(),
      course: z.string().optional(),
      currentYear: z.string().optional(),
    }).optional(),
  }).optional(),
  professionalCertification: z.string().optional(), 
});
const FormSchema = PersonalDetailsSchema.merge(LocationLanguageSchema).merge(LearningStyleSchema).merge(EducationCategorySchema).merge(EducationDetailsSchema);
const defaultValues: UserProfile = {
  name: "",
  age: 0,
  gender: GENDERS[0]?.value || "",
  country: COUNTRIES[0]?.value || "",
  state: "",
  preferredLanguage: LANGUAGES[0]?.value || "",
  learningStyle: LEARNING_STYLES[0]?.value || "",
  educationCategory: EDUCATION_CATEGORIES[0]?.value as EducationCategory,
  educationQualification: {
    boardExams: { board: "", standard: "", subjectSegment: "" }, 
    competitiveExams: { examType: "", specificExam: "", stage: "", examDate: undefined },
    universityExams: { universityName: "", collegeName: "", course: "", currentYear: "" },
  },
};

export function OnboardingForm() {
  const { setProfile, profile: existingProfile } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [currentExamStages, setCurrentExamStages] = useState<{ value: string; label: string }[]>([]);
  
  const [probingQuestions, setProbingQuestions] = useState<string[]>([]);
  const [isShowingProbingQuestions, setIsShowingProbingQuestions] = useState(false);
  const [isGeneratingProbingQuestions, setIsGeneratingProbingQuestions] = useState(false);

  const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");

  const filteredLanguages = useMemo(() => 
    LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(languageSearch.toLowerCase())
    ), [languageSearch]);


  const form = useForm<UserProfile>({
    resolver: zodResolver(FormSchema),
    defaultValues: existingProfile && existingProfile.name ? {
      ...existingProfile,
      age: existingProfile.age || 0, 
      learningStyle: existingProfile.learningStyle || LEARNING_STYLES[0]?.value || "",
      educationCategory: existingProfile.educationCategory || EDUCATION_CATEGORIES[0]?.value as EducationCategory,
      educationQualification: { 
        boardExams: existingProfile.educationQualification?.boardExams || { board: "", standard: "", subjectSegment: "" }, 
        competitiveExams: {
           ...(existingProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "", stage: "" }),
           examDate: existingProfile.educationQualification?.competitiveExams?.examDate && isValid(parseISO(existingProfile.educationQualification.competitiveExams.examDate)) 
                     ? parseISO(existingProfile.educationQualification.competitiveExams.examDate) 
                     : undefined,
        },
        universityExams: existingProfile.educationQualification?.universityExams || { universityName: "", collegeName: "", course: "", currentYear: "" },
      }
 } : defaultValues,

    mode: "onChange", 
  });

  const watchedEducationCategory = form.watch("educationCategory");
  const watchedCompetitiveExamType = form.watch("educationQualification.competitiveExams.examType");
  const watchedSpecificExam = form.watch("educationQualification.competitiveExams.specificExam");
  const watchedBoardStandard = form.watch("educationQualification.boardExams.standard");


  useEffect(() => {
    if (watchedEducationCategory === "competitive" && watchedCompetitiveExamType === "ProfessionalCertifications" && watchedSpecificExam) {
      const stages = PROFESSIONAL_CERTIFICATION_STAGES[watchedSpecificExam] || [];
      setCurrentExamStages(stages);
      if (stages.length === 0) { 
        form.setValue("educationQualification.competitiveExams.stage", undefined);
      }
    } else {
      setCurrentExamStages([]);
      form.setValue("educationQualification.competitiveExams.stage", undefined); 
    }
  }, [watchedEducationCategory, watchedCompetitiveExamType, watchedSpecificExam, form]);


  const progressValue = useMemo(() => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    return ((currentIndex + 1) / onboardingSteps.length) * 100;
  }, [currentStep]);

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === "personal") {
      isValid = await form.trigger(["name", "age", "gender"]);
    } else if (currentStep === "location") {
      isValid = await form.trigger(["country", "state", "preferredLanguage"]);
    } else if (currentStep === "learningStyle") {
      isValid = await form.trigger(["learningStyle"]);
    } else if (currentStep === "educationCategory") {
      isValid = await form.trigger(["educationCategory"]);
    } else if (currentStep === "educationDetails") {
      isValid = true; 
      if (watchedEducationCategory === "board") {
        const boardFieldValue = form.getValues("educationQualification.boardExams.board");
        const standardSelected = !!form.getValues("educationQualification.boardExams.standard");
        
        if (!boardFieldValue || boardFieldValue.trim() === "" || boardFieldValue === "State Board" || boardFieldValue === "Other_Central_Board") {
            form.setError("educationQualification.boardExams.board", { type: "manual", message: "Please select or specify a board name." });
            isValid = false;
        } else {
            form.clearErrors("educationQualification.boardExams.board");
        }
        
        if (!standardSelected) {
            form.setError("educationQualification.boardExams.standard", { type: "manual", message: "Please select a standard." });
            isValid = false;
        } else {
            form.clearErrors("educationQualification.boardExams.standard");
        }

        if (standardSelected && (watchedBoardStandard === "11" || watchedBoardStandard === "12")) {
            const subjectSegmentValue = form.getValues("educationQualification.boardExams.subjectSegment");
            if (!subjectSegmentValue || subjectSegmentValue.trim() === "") {
                form.setError("educationQualification.boardExams.subjectSegment", { type: "manual", message: "Please specify your subject segment/stream for 11th/12th." });
                isValid = false;
            } else {
                form.clearErrors("educationQualification.boardExams.subjectSegment");
            }
        }
        
        if(isValid) isValid = await form.trigger(["educationQualification.boardExams.board", "educationQualification.boardExams.standard", "educationQualification.boardExams.subjectSegment"]);

      } else if (watchedEducationCategory === "competitive") {
        const examTypeSelected = !!form.getValues("educationQualification.competitiveExams.examType");
        const specificExamValue = form.getValues("educationQualification.competitiveExams.specificExam");

        if (!examTypeSelected) {
            form.setError("educationQualification.competitiveExams.examType", { type: "manual", message: "Please select an exam category." });
            isValid = false;
        } else if (!specificExamValue || specificExamValue.trim() === "") {
            form.setError("educationQualification.competitiveExams.specificExam", { type: "manual", message: "Please select or specify an exam." });
            isValid = false;
        } else {
            const isOtherTemplateValue = getCombinedCompetitiveExamList().some(e => e.value === specificExamValue && e.value.startsWith("Other_")) ||
                                         PROFESSIONAL_CERTIFICATION_EXAMS.some(e => e.value === specificExamValue && e.value.startsWith("Other_"));
            
            if (isOtherTemplateValue && specificExamValue.endsWith("(Specify below)")) { 
                 form.setError("educationQualification.competitiveExams.specificExam", { type: "manual", message: "Please specify the exam name." });
                 isValid = false;
            } else if (specificExamValue.startsWith("Other_") && specificExamValue === watchedSpecificExam) { 
                form.setError("educationQualification.competitiveExams.specificExam", { type: "manual", message: "Please specify the exam name." });
                isValid = false;
            } else {
                form.clearErrors("educationQualification.competitiveExams.specificExam");
                isValid = true;
            }
        }
        if (isValid && watchedCompetitiveExamType === "ProfessionalCertifications" && currentExamStages.length > 0) {
            const selectedStage = form.getValues("educationQualification.competitiveExams.stage");
            if (!selectedStage) {
                form.setError("educationQualification.competitiveExams.stage", { type: "manual", message: "Please select a stage for this certification." });
                isValid = false;
            } else {
                 isValid = await form.trigger(["educationQualification.competitiveExams.stage"]);
            }
        }
        if (isValid) { 
            isValid = await form.trigger(["educationQualification.competitiveExams.examType", "educationQualification.competitiveExams.specificExam"]);
        }

      } else if (watchedEducationCategory === "university") {
        const uniNameSelected = !!form.getValues("educationQualification.universityExams.universityName");
        const courseSelected = !!form.getValues("educationQualification.universityExams.course");
        const yearSelected = !!form.getValues("educationQualification.universityExams.currentYear");
        if(!uniNameSelected) form.setError("educationQualification.universityExams.universityName", {type: "manual", message: "University name is required."});
        if(!courseSelected) form.setError("educationQualification.universityExams.course", {type: "manual", message: "Course/Major is required."});
        if(!yearSelected) form.setError("educationQualification.universityExams.currentYear", {type: "manual", message: "Current year is required."});
        isValid = uniNameSelected && courseSelected && yearSelected && (await form.trigger(["educationQualification.universityExams.universityName", "educationQualification.universityExams.course", "educationQualification.universityExams.currentYear"]));
      }
    }


    if (isValid) {
      const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
      if (currentIndex < onboardingSteps.length - 1) {
        if (currentStep === "educationCategory" && form.getValues("educationCategory") === "other") {
           setCurrentStep("review"); 
        } else if (currentStep === "educationCategory" && form.getValues("educationCategory") !== "other") {
           setCurrentStep("educationDetails"); 
        }
        else {
          setCurrentStep(onboardingSteps[currentIndex + 1].id);
        }
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
     if (currentStep === "review" && form.getValues("educationCategory") === "other") {
        setCurrentStep("educationCategory"); 
    } else if (currentStep === "educationDetails") { 
        setCurrentStep("educationCategory");
    }
    else if (currentIndex > 0) {
      setCurrentStep(onboardingSteps[currentIndex - 1].id);
    }
  };

  async function onSubmit(data: UserProfile) {
    const competitiveExamData = data.educationCategory === "competitive" 
        ? {
            ...data.educationQualification?.competitiveExams,
            examDate: data.educationQualification?.competitiveExams?.examDate 
                        ? format(data.educationQualification.competitiveExams.examDate, "yyyy-MM-dd") 
                        : undefined,
          }
        : undefined;

    const finalProfile: UserProfile = {
      ...data,
      age: Number(data.age), 
      id: existingProfile?.id || `user-${Date.now()}`, 
      learningStyle: data.learningStyle || 'balanced', 
      educationQualification: {
        boardExams: data.educationCategory === "board" ? data.educationQualification?.boardExams : undefined,
        competitiveExams: competitiveExamData,
        universityExams: data.educationCategory === "university" ? data.educationQualification?.universityExams : undefined,
      }
    };
    setProfile(finalProfile);
    
    setIsGeneratingProbingQuestions(true);
    try {
      const response = await generateOnboardingQuestions(finalProfile as GenerateOnboardingQuestionsInput);
      setProbingQuestions(response.questions);
      setIsShowingProbingQuestions(true);
    } catch (err) {
      console.error("Failed to generate probing questions:", err);
      toast({ title: "Onboarding Complete!", description: "Could not load further reflection questions, but your profile is saved. Proceeding to dashboard.", variant: "default", duration: 5000 });
      router.push("/dashboard"); 
    } finally {
      setIsGeneratingProbingQuestions(false);
    }
  }


  const currentStepDetails = onboardingSteps.find(s => s.id === currentStep);

  const showSpecificExamTextInput = useMemo(() => {
    if (watchedEducationCategory !== "competitive" || !watchedCompetitiveExamType) {
        return false;
    }
    if (watchedCompetitiveExamType === "Other") return true;

    const selectedSpecificExam = form.getValues("educationQualification.competitiveExams.specificExam");
    return selectedSpecificExam?.startsWith("Other_") || 
           (selectedSpecificExam && (
             selectedSpecificExam.includes("(Specify Name)") ||
             selectedSpecificExam.includes("(Specify State & Exam)") ||
             selectedSpecificExam.includes("(Specify State)")
           ));
  }, [watchedEducationCategory, watchedCompetitiveExamType, form.watch("educationQualification.competitiveExams.specificExam")]);


  const getSpecificExamInputLabel = () => {
    const specificExamVal = form.getValues("educationQualification.competitiveExams.specificExam");
    if (specificExamVal?.startsWith("Other_Specialized_Domain_Exam")) return "Specify Specialized Domain Exam Name";
    if (specificExamVal?.startsWith("Other_Central_Board")) return "Specify Other Central Board Name";
    if (specificExamVal?.startsWith("Other_Central_Exam")) return "Specify Other Central Exam Name";
    if (specificExamVal?.startsWith("Other_Banking_Central")) return "Specify Other Central Banking Exam Name";
    if (specificExamVal?.startsWith("Other_SSC_Exam")) return "Specify Other SSC Exam Name";
    if (specificExamVal?.startsWith("Other_State_Exam")) return "Specify Other State Exam Name";
    if (specificExamVal?.startsWith("Other_Banking_State")) return "Specify Other State Banking Exam Name";
    if (specificExamVal?.startsWith("Other_Professional_Cert")) return "Specify Other Professional Certification";
    if (specificExamVal?.includes("(Specify Name)")) return `Specify ${specificExamVal.replace(" (Specify Name)","")} Name`;
    if (specificExamVal?.includes("(Specify State & Exam)")) return `Specify State & Exam for ${specificExamVal.replace(" (Specify State & Exam)","")}`;
    if (specificExamVal?.includes("(Specify State)")) return `Specify State for ${specificExamVal.replace(" (Specify State)","")}`;
    if (watchedCompetitiveExamType === "Other") return "Specify Exam Name / Job Posting";
    return "Specify Exam Name / Details";
  }

  const getSpecificExamInputPlaceholder = () => {
    const specificExamVal = form.getValues("educationQualification.competitiveExams.specificExam");
    if (specificExamVal?.startsWith("Other_Specialized_Domain_Exam")) return "E.g., National Arts Talent Search";
    if (specificExamVal?.startsWith("Other_Central_Board")) return "E.g., My Custom Central Board";
    if (specificExamVal?.startsWith("Other_SSC_Exam")) return "E.g., SSC Selection Post";
    if (specificExamVal?.includes("(Specify Name)")) return `E.g., My State Civil Services`;
    if (specificExamVal?.includes("(Specify State & Exam)")) return `E.g., Maharashtra - MPSC Rajyaseva`;
    if (specificExamVal?.includes("(Specify State)")) return `E.g., Tamil Nadu TET`;
    if (watchedCompetitiveExamType === "Other") return "E.g., Local Scholarship Test or Specific Job Title";
    return "Name of the 'Other' exam or specific post details";
  }
  
  const getCombinedCompetitiveExamList = () => {
    let list: {value: string, label: string}[] = [];
    if (watchedCompetitiveExamType === "Central") {
        list = COMPETITIVE_EXAM_TYPES_CENTRAL;
    } else if (watchedCompetitiveExamType === "State") {
        list = COMPETITIVE_EXAM_TYPES_STATE;
    } else if (watchedCompetitiveExamType === "ProfessionalCertifications") {
        list = PROFESSIONAL_CERTIFICATION_EXAMS;
    }
    return list;
  };

  if (isGeneratingProbingQuestions) {
    return (
      <Card className="w-full max-w-2xl shadow-2xl my-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gradient-primary">Finalizing Setup</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            AI is generating some thought-provoking questions for you...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-6 text-lg text-muted-foreground">Please wait a moment.</p>
        </CardContent>
      </Card>
    );
  }

  if (isShowingProbingQuestions) {
    return (
      <Card className="w-full max-w-2xl shadow-2xl my-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gradient-primary">Onboarding Complete!</CardTitle>
           <CardDescription className="text-center text-muted-foreground">
            Your profile is saved. Here are some questions from MentorAI to kickstart your thinking:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-md shadow-inner bg-muted/50">
            <ul className="space-y-3 list-decimal list-inside text-sm text-foreground">
              {probingQuestions.map((q, index) => (
                <li key={index} className="flex items-start">
                  <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0"/> 
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground text-center">Consider these questions as you begin your learning journey. You don't need to answer them here.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/dashboard")} className="gap-1 text-base px-8 py-3">
            Continue to Dashboard <ChevronRight className="h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl my-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-gradient-primary">Welcome to EduAI Tutor!</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          {existingProfile?.name ? `Updating profile for ${existingProfile.name}. ` : "Let's personalize your learning experience. "} 
          ({onboardingSteps.findIndex(s => s.id === currentStep) + 1} of {onboardingSteps.length})
        </CardDescription>
        <Progress value={progressValue} className="w-full mt-2" />
        {currentStepDetails && <p className="text-center font-semibold mt-4 text-xl">{currentStepDetails.title}</p>}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {currentStep === "personal" && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Ada Lovelace" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="E.g., 18" {...field} value={field.value === 0 ? '' : field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === "location" && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., California or Tamil Nadu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Language for Learning</FormLabel>
                        <Popover open={isLangPopoverOpen} onOpenChange={setIsLangPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? LANGUAGES.find((language) => language.value === field.value)?.label
                                  : "Select your preferred language"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <div className="p-2 border-b">
                                <Input 
                                    placeholder="Search language..."
                                    value={languageSearch}
                                    onChange={(e) => setLanguageSearch(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <ScrollArea className="h-72">
                              <div className="p-1">
                                {filteredLanguages.map((language) => (
                                  <Button
                                    variant="ghost"
                                    key={language.value}
                                    onClick={() => {
                                      form.setValue("preferredLanguage", language.value);
                                      setIsLangPopoverOpen(false);
                                      setLanguageSearch("");
                                    }}
                                    className="w-full justify-start font-normal text-sm h-9"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        language.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <span className="truncate">{language.label}</span>
                                  </Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === "learningStyle" && (
                 <FormField
                  control={form.control}
                  name="learningStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Learning Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value as LearningStyle} defaultValue={field.value as LearningStyle}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your learning style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEARNING_STYLES.map(style => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>This helps us tailor content to how you learn best.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            
            {currentStep === "educationCategory" && (
                 <FormField
                  control={form.control}
                  name="educationCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is your primary education focus?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value as EducationCategory} defaultValue={field.value as EducationCategory}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EDUCATION_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {currentStep === "educationDetails" && watchedEducationCategory && (
              <div className="space-y-6">
                {watchedEducationCategory === "board" && (
                  <>
                    <FormField
                      control={form.control}
                      name="educationQualification.boardExams.board"
                      render={({ field }) => {
                        const [selectedBoardCategory, setSelectedBoardCategory] = useState(() => {
                            const initialFieldValue = field.value;
                            if (!initialFieldValue) return ""; 
                            if (CENTRAL_BOARDS.some(b => b.value === initialFieldValue && b.value !== "Other_Central_Board")) {
                                return initialFieldValue;
                            }
                            if (initialFieldValue === "Other_Central_Board") return "Other_Central_Board";
                            if (initialFieldValue && !CENTRAL_BOARDS.some(b => b.value === initialFieldValue)) return "State Board"; 
                            return initialFieldValue || ""; 
                        });
                        
                        const showSpecifyInput = selectedBoardCategory === "Other_Central_Board" || selectedBoardCategory === "State Board";

                        return (
                          <FormItem>
                            <FormLabel>Board Name</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                setSelectedBoardCategory(value);
                                if (value === "Other_Central_Board" || value === "State Board") {
                                  field.onChange(""); 
                                } else {
                                  field.onChange(value); 
                                }
                              }}
                              value={selectedBoardCategory} 
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Board">
                                    {showSpecifyInput && field.value 
                                      ? field.value
                                      : CENTRAL_BOARDS.find(b => b.value === selectedBoardCategory)?.label || 
                                        (selectedBoardCategory === "State Board" ? "State Board (Specify your state's board)" : selectedBoardCategory) || 
                                        "Select Board"
                                    }
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent side="top">
                                {CENTRAL_BOARDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                                <SelectItem value="State Board">State Board (Specify your state's board)</SelectItem>
                              </SelectContent>
                            </Select>
                            {showSpecifyInput && (
                              <Input
                                className="mt-2"
                                placeholder={selectedBoardCategory === "Other_Central_Board" ? "Specify other central board name" : "E.g., Tamil Nadu State Board"}
                                value={field.value} 
                                onChange={field.onChange}
                              />
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="educationQualification.boardExams.standard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standard/Grade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Standard" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BOARD_STANDARDS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchedBoardStandard && (watchedBoardStandard === "11" || watchedBoardStandard === "12") && (
                        <FormField
                            control={form.control}
                            name="educationQualification.boardExams.subjectSegment"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject Segment / Stream</FormLabel>
                                <FormControl>
                                <Input placeholder="E.g., Science with Biology, Commerce with Maths" {...field} />
                                </FormControl>
                                <FormDescription>
                                Your main subject group for 11th/12th (e.g., PCM, PCB, Commerce, Arts).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                  </>
                )}
                {watchedEducationCategory === "competitive" && (
                  <>
                    <FormField
                      control={form.control}
                      name="educationQualification.competitiveExams.examType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Category</FormLabel>
                          <Select onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("educationQualification.competitiveExams.specificExam", ""); 
                              form.setValue("educationQualification.competitiveExams.stage", ""); 
                              form.setValue("educationQualification.competitiveExams.examDate", undefined);
                            }} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Exam Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Central">Central Government Exams / Entrance</SelectItem>
                                <SelectItem value="State">State Government Exams / Entrance</SelectItem>
                                <SelectItem value="ProfessionalCertifications">Professional Certifications</SelectItem>
                                <SelectItem value="Other">Other Competitive Exams</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(watchedCompetitiveExamType === "Central" || watchedCompetitiveExamType === "State" || watchedCompetitiveExamType === "ProfessionalCertifications") && (
                       <FormField
                        control={form.control}
                        name="educationQualification.competitiveExams.specificExam" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Exam / Certification</FormLabel>
                             <Select 
                                onValueChange={(value) => {
                                  field.onChange(value); 
                                  form.setValue("educationQualification.competitiveExams.stage", ""); 
                                  if (value && !value.startsWith("Other_") && !value.includes("(Specify")) {
                                     form.clearErrors("educationQualification.competitiveExams.specificExam");
                                  }
                                }} 
                                value={field.value} 
                                defaultValue={field.value}
                             >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select Specific ${watchedCompetitiveExamType === "ProfessionalCertifications" ? "Certification" : "Exam"}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getCombinedCompetitiveExamList().map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                             {(field.value?.startsWith("Other_") || (field.value && (field.value.includes("(Specify Name)") || field.value.includes("(Specify State & Exam)") || field.value.includes("(Specify State)")))) && 
                              <FormDescription className="mt-1">Please specify the exam/certification name/details in the text field below.</FormDescription>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {showSpecificExamTextInput && (
                        <FormField
                          control={form.control}
                          name="educationQualification.competitiveExams.specificExam" 
                           render={({ field: { onChange, value, ...restField } }) => {
                              const isPlaceholderValue = value?.startsWith("Other_") || (value && (value.includes("(Specify Name)") || value.includes("(Specify State & Exam)") || value.includes("(Specify State)")));
                              const displayValue = isPlaceholderValue ? "" : value;
                              
                              return (
                                <FormItem>
                                  <FormLabel>
                                    {getSpecificExamInputLabel()}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder={getSpecificExamInputPlaceholder()}
                                      value={displayValue || ""}
                                      onChange={(e) => {
                                        onChange(e.target.value); 
                                      }}
                                      {...restField} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                           }}
                        />
                    )}
                    {watchedEducationCategory === "competitive" && watchedCompetitiveExamType === "ProfessionalCertifications" && currentExamStages.length > 0 && (
                      <FormField
                        control={form.control}
                        name="educationQualification.competitiveExams.stage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stage</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currentExamStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {watchedEducationCategory === "competitive" && (
                      <FormField
                        control={form.control}
                        name="educationQualification.competitiveExams.examDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Exam Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal justify-start",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick exam date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Let the AI know your exam timeline for personalized support.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
                {watchedEducationCategory === "university" && (
                  <>
                    <FormField
                      control={form.control}
                      name="educationQualification.universityExams.universityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Stanford University or Anna University" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="educationQualification.universityExams.collegeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Name (if applicable)</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., College of Engineering, Guindy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="educationQualification.universityExams.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course / Major</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., B.Tech Computer Science or M.A. History" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="educationQualification.universityExams.currentYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Year of Study</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNIVERSITY_YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {watchedEducationCategory === "other" && (
                    <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">No specific educational details required for this category. You can proceed to the next step.</p>
                )}
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-4 p-4 border rounded-md shadow-inner bg-card">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Review Your Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {form.getValues("name")}</p>
                  <p><strong>Age:</strong> {form.getValues("age")}</p>
                  <p><strong>Gender:</strong> {GENDERS.find(g => g.value === form.getValues("gender"))?.label || 'N/A'}</p>
                  <p><strong>Country:</strong> {COUNTRIES.find(c => c.value === form.getValues("country"))?.label || 'N/A'}</p>
                  <p><strong>State:</strong> {form.getValues("state")}</p>
                  <p><strong>Preferred Language:</strong> {LANGUAGES.find(l => l.value === form.getValues("preferredLanguage"))?.label || 'N/A'}</p>
                  <p><strong>Learning Style:</strong> {LEARNING_STYLES.find(ls => ls.value === form.getValues("learningStyle"))?.label || 'Balanced'}</p>
                  <p><strong>Education Focus:</strong> {EDUCATION_CATEGORIES.find(ec => ec.value === watchedEducationCategory)?.label || 'N/A'}</p>
                  
                  {watchedEducationCategory === "board" && form.getValues("educationQualification.boardExams") && (
                    <div className="pl-4 mt-1 border-l-2 border-primary/50">
                      <p><strong>Board:</strong> {form.getValues("educationQualification.boardExams.board") || 'N/A'}</p>
                      <p><strong>Standard:</strong> {BOARD_STANDARDS.find(s => s.value === form.getValues("educationQualification.boardExams.standard"))?.label || 'N/A'}</p>
                      {(form.getValues("educationQualification.boardExams.standard") === "11" || form.getValues("educationQualification.boardExams.standard") === "12") && form.getValues("educationQualification.boardExams.subjectSegment") && (
                        <p><strong>Subject Segment:</strong> {form.getValues("educationQualification.boardExams.subjectSegment")}</p>
                      )}
                    </div>
                  )}
                  {watchedEducationCategory === "competitive" && form.getValues("educationQualification.competitiveExams") && (
                     <div className="pl-4 mt-1 border-l-2 border-primary/50">
                      <p><strong>Exam Category:</strong> {form.getValues("educationQualification.competitiveExams.examType") || 'N/A'}</p>
                      <p><strong>Specific Exam/Certification:</strong> {
                        getCombinedCompetitiveExamList().find(e => e.value === form.getValues("educationQualification.competitiveExams.specificExam"))?.label ||
                        form.getValues("educationQualification.competitiveExams.specificExam") || 'N/A' 
                      }</p> 
                      {form.getValues("educationQualification.competitiveExams.examType") === "ProfessionalCertifications" && form.getValues("educationQualification.competitiveExams.stage") && (
                         <p><strong>Stage:</strong> {
                            (PROFESSIONAL_CERTIFICATION_STAGES[form.getValues("educationQualification.competitiveExams.specificExam") || ""] || [])
                            .find(s => s.value === form.getValues("educationQualification.competitiveExams.stage"))?.label || 'N/A'
                         }</p>
                      )}
                      {form.getValues("educationQualification.competitiveExams.examDate") && (
                         <p><strong>Exam Date:</strong> {format(form.getValues("educationQualification.competitiveExams.examDate") as Date, "PPP")}</p>
                      )}
                    </div>
                  )}
                  {watchedEducationCategory === "university" && form.getValues("educationQualification.universityExams") && (
                    <div className="pl-4 mt-1 border-l-2 border-primary/50">
                      <p><strong>University:</strong> {form.getValues("educationQualification.universityExams.universityName") || 'N/A'}</p>
                      <p><strong>College:</strong> {form.getValues("educationQualification.universityExams.collegeName") || 'N/A'}</p>
                      <p><strong>Course:</strong> {form.getValues("educationQualification.universityExams.course") || 'N/A'}</p>
                      <p><strong>Year:</strong> {UNIVERSITY_YEARS.find(y => y.value === form.getValues("educationQualification.universityExams.currentYear"))?.label || 'N/A'}</p>
                    </div>
                  )}
                   {form.getValues("professionalCertification") && ( 
                     <p><strong>Professional Certification (Legacy):</strong> {form.getValues("professionalCertification") === "Other_Professional_Cert" ? `Other: ${form.getValues("professionalCertification")}` : form.getValues("professionalCertification")}</p>
                   )}
                </div>
                <p className="text-xs text-muted-foreground pt-3 border-t">Please review your details carefully. You can go back to make changes.</p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === "personal"}
            className="gap-1 transition-colors duration-150 ease-in-out hover:bg-muted/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentStep !== "review" ? (
            <Button type="button" onClick={handleNext} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="gap-1">
              {existingProfile?.name ? "Update Profile" : "Complete Setup"}
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
    </Card>
  );
}
