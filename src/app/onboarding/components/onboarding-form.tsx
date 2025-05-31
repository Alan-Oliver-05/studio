
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
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES, BOARD_STANDARDS, UNIVERSITY_YEARS, CENTRAL_BOARDS, COMPETITIVE_EXAM_TYPES_CENTRAL, COMPETITIVE_EXAM_TYPES_STATE, LEARNING_STYLES, PROFESSIONAL_CERTIFICATION_EXAMS } from "@/lib/constants";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

const onboardingSteps = [
  { id: "personal", title: "Personal Details" },
  { id: "location", title: "Location & Language" },
  { id: "learningStyle", title: "Learning Style" },
  { id: "educationCategory", title: "Education Focus" },
  { id: "educationDetails", title: "Education Details" }, // Added this step explicitly
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
    }).optional(),
    competitiveExams: z.object({
      examType: z.string().optional(), 
      specificExam: z.string().optional(), 
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional(),
      collegeName: z.string().optional(),
      course: z.string().optional(),
      currentYear: z.string().optional(),
    }).optional(),
  }).optional(),
  professionalCertification: z.string().optional(), // For the separate certification field if needed
});
const FormSchema = PersonalDetailsSchema.merge(LocationLanguageSchema).merge(LearningStyleSchema).merge(EducationCategorySchema).merge(EducationDetailsSchema);
const defaultValues: UserProfile = {
  name: "",
  age: "",
  gender: GENDERS[0]?.value || "",
  country: COUNTRIES[0]?.value || "",
  state: "",
  preferredLanguage: LANGUAGES[0]?.value || "",
  learningStyle: LEARNING_STYLES[0]?.value || "",
  educationCategory: EDUCATION_CATEGORIES[0]?.value as EducationCategory,
  educationQualification: {
    boardExams: { board: "", standard: "" },
    competitiveExams: { examType: "", specificExam: "" },
    universityExams: { universityName: "", collegeName: "", course: "", currentYear: "" },
  },
};

export function OnboardingForm() {
  const { setProfile, profile: existingProfile } = useUserProfile();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");

  const form = useForm<UserProfile>({
    resolver: zodResolver(FormSchema),
    defaultValues: existingProfile && existingProfile.name ? {
      ...existingProfile,
      age: existingProfile.age || "", 
      learningStyle: existingProfile.learningStyle || LEARNING_STYLES[0]?.value || "",
      educationCategory: existingProfile.educationCategory || EDUCATION_CATEGORIES[0]?.value as EducationCategory,
      educationQualification: { 
        boardExams: existingProfile.educationQualification?.boardExams || { board: "", standard: "" },
        competitiveExams: existingProfile.educationQualification?.competitiveExams || { examType: "", specificExam: "" },
        universityExams: existingProfile.educationQualification?.universityExams || { universityName: "", collegeName: "", course: "", currentYear: "" },
      }
 } : defaultValues,

    mode: "onChange", 
  });

  const watchedEducationCategory = form.watch("educationCategory");
  const watchedCompetitiveExamType = form.watch("educationQualification.competitiveExams.examType");
  const watchedSpecificExamFromDropdown = form.watch("educationQualification.competitiveExams.specificExam"); // This tracks the value from the dropdown


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
        const boardSelected = !!form.getValues("educationQualification.boardExams.board");
        const standardSelected = !!form.getValues("educationQualification.boardExams.standard");
        if (!boardSelected) form.setError("educationQualification.boardExams.board", { type: "manual", message: "Please select or specify a board." });
        if (!standardSelected) form.setError("educationQualification.boardExams.standard", { type: "manual", message: "Please select a standard." });
        isValid = boardSelected && standardSelected && (await form.trigger(["educationQualification.boardExams.board", "educationQualification.boardExams.standard"]));
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
            // If an "Other_" type was chosen from the dropdown, the text input (which is the same field) should have been filled.
            // The value `specificExamValue` already reflects the typed text or the dropdown choice.
            // If it was a dropdown choice not starting with "Other_", it's valid.
            // If it started with "Other_" from the dropdown, its value *is* that "Other_...", and it means the user hasn't typed anything new.
            // So, if `specificExamValue` is one of the "Other_" template values, it means the user hasn't specified.
            const isOtherTemplateValue = COMPETITIVE_EXAM_TYPES_CENTRAL.some(e => e.value === specificExamValue && e.value.startsWith("Other_")) ||
                                         COMPETITIVE_EXAM_TYPES_STATE.some(e => e.value === specificExamValue && e.value.startsWith("Other_")) ||
                                         PROFESSIONAL_CERTIFICATION_EXAMS.some(e => e.value === specificExamValue && e.value.startsWith("Other_"));
            
            if (isOtherTemplateValue && specificExamValue.endsWith("(Specify below)")) { // More robust check if label was used as value initially
                 form.setError("educationQualification.competitiveExams.specificExam", { type: "manual", message: "Please specify the exam name." });
                 isValid = false;
            } else if (specificExamValue.startsWith("Other_") && specificExamValue === watchedSpecificExamFromDropdown) { // Check if it's still the placeholder "Other_" value
                form.setError("educationQualification.competitiveExams.specificExam", { type: "manual", message: "Please specify the exam name." });
                isValid = false;
            } else {
                form.clearErrors("educationQualification.competitiveExams.specificExam");
                isValid = true;
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
           setCurrentStep("educationDetails"); // Go to details if not "other"
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
    } else if (currentStep === "educationDetails") { // If on details, go back to category
        setCurrentStep("educationCategory");
    }
    else if (currentIndex > 0) {
      setCurrentStep(onboardingSteps[currentIndex - 1].id);
    }
  };

  function onSubmit(data: UserProfile) {
    const finalProfile: UserProfile = {
      ...data,
      age: Number(data.age), 
      id: existingProfile?.id || `user-${Date.now()}`, 
      learningStyle: data.learningStyle || 'balanced', // Default if empty
      educationQualification: {
        boardExams: data.educationCategory === "board" ? data.educationQualification?.boardExams : undefined,
        competitiveExams: data.educationCategory === "competitive" ? data.educationQualification?.competitiveExams : undefined,
        universityExams: data.educationCategory === "university" ? data.educationQualification?.universityExams : undefined,
      }
    };
    setProfile(finalProfile);
    router.push("/dashboard");
  }

  const currentStepDetails = onboardingSteps.find(s => s.id === currentStep);

  const showSpecificExamTextInput = useMemo(() => {
    if (watchedEducationCategory !== "competitive" || !watchedCompetitiveExamType) {
        return false;
    }
    if (watchedCompetitiveExamType === "Other") return true;

    const selectedExamFromDropdown = form.getValues("educationQualification.competitiveExams.specificExam");
    return selectedExamFromDropdown?.startsWith("Other_") || 
           (selectedExamFromDropdown && (
             selectedExamFromDropdown.includes("(Specify Name)") ||
             selectedExamFromDropdown.includes("(Specify State & Exam)") ||
             selectedExamFromDropdown.includes("(Specify State)")
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
                    <FormItem>
                      <FormLabel>Preferred Language for Learning</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preferred language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board Name</FormLabel>
                           <Select onValueChange={(value) => {
                             field.onChange(value);
                             if (value === "Other_Central_Board" || value === "State Board") { 
                               // Keep 'Other_Central_Board' or 'State Board' as the value to trigger text input
                               form.setValue("educationQualification.boardExams.board", value); 
                             }
                           }} value={field.value} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Board (e.g., CBSE)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {CENTRAL_BOARDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                                <SelectItem value="State Board">State Board (Specify your state's board)</SelectItem>
                            </SelectContent>
                          </Select>
                          {(field.value === "Other_Central_Board" || field.value === "State Board") && (
                            <Input 
                                className="mt-2"
                                placeholder={field.value === "Other_Central_Board" ? "Specify other central board name" : "E.g., Tamil Nadu State Board"}
                                // This controlled input reflects any user typed text for the "Other" board.
                                // It's not directly field.value because field.value remains "Other_Central_Board" or "State Board".
                                // We need a way to store the typed text. For simplicity, we modify the field.value itself upon blur or submit if it was "Other_".
                                // A better way would be a separate state or form field for the "other" text.
                                // For now, we'll rely on the main field.value being updated if needed.
                                onChange={(e) => field.onChange(e.target.value)} // This will overwrite "Other_Central_Board"
                                defaultValue={form.getValues("educationQualification.boardExams.board") !== "Other_Central_Board" && form.getValues("educationQualification.boardExams.board") !== "State Board" ? form.getValues("educationQualification.boardExams.board") : ""}
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
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
                        name="educationQualification.competitiveExams.specificExam" // This field will hold the specific exam (either dropdown value or typed text)
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Exam / Certification</FormLabel>
                             <Select 
                                onValueChange={(value) => {
                                  // When a dropdown item is selected, update the form field.
                                  // If it's an "Other..." type, this value serves as a trigger for the text input.
                                  // The actual text input will then overwrite this if the user types.
                                  field.onChange(value); 
                                  if (value && !value.startsWith("Other_") && !value.includes("(Specify")) {
                                     form.clearErrors("educationQualification.competitiveExams.specificExam");
                                  }
                                }} 
                                value={field.value} // This binds to the form state for specificExam
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
                          name="educationQualification.competitiveExams.specificExam" // This is the SAME field used by the select above
                           render={({ field: { onChange, value, ...restField } }) => {
                              // If the current `value` is one of the "Other_" placeholders, display an empty input for the user to type.
                              // Otherwise, display the `value` (which might be a specific exam from dropdown or already typed text).
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
                                        onChange(e.target.value); // User typing directly updates the field
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
                      <p><strong>Board:</strong> {form.getValues("educationQualification.boardExams.board")?.startsWith("Other_") || form.getValues("educationQualification.boardExams.board") === "State Board" ? `Specified: ${form.getValues("educationQualification.boardExams.board")}` : form.getValues("educationQualification.boardExams.board") || 'N/A'}</p>
                      <p><strong>Standard:</strong> {BOARD_STANDARDS.find(s => s.value === form.getValues("educationQualification.boardExams.standard"))?.label || 'N/A'}</p>
                    </div>
                  )}
                  {watchedEducationCategory === "competitive" && form.getValues("educationQualification.competitiveExams") && (
                     <div className="pl-4 mt-1 border-l-2 border-primary/50">
                      <p><strong>Exam Category:</strong> {form.getValues("educationQualification.competitiveExams.examType") || 'N/A'}</p>
                      <p><strong>Specific Exam/Certification:</strong> {
                        // Try to find label from combined list first
                        getCombinedCompetitiveExamList().find(e => e.value === form.getValues("educationQualification.competitiveExams.specificExam"))?.label ||
                        form.getValues("educationQualification.competitiveExams.specificExam") || 'N/A' // Fallback to raw value
                      }</p> 
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
                   {form.getValues("professionalCertification") && ( // Kept for legacy data, though competitiveExams handles it now
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

    