
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
import { UserProfile, EducationCategory } from "@/types";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES, BOARD_STANDARDS, UNIVERSITY_YEARS, CENTRAL_BOARDS, COMPETITIVE_EXAM_TYPES_CENTRAL, COMPETITIVE_EXAM_TYPES_STATE } from "@/lib/constants";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

const onboardingSteps = [
  { id: "personal", title: "Personal Details" },
  { id: "location", title: "Location & Language" },
  { id: "educationCategory", title: "Education Focus" },
  { id: "educationDetails", title: "Education Specifics" },
  { id: "review", title: "Review & Complete" },
] as const;

type StepId = typeof onboardingSteps[number]["id"];

const PersonalDetailsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(5, { message: "Age must be at least 5." }).max(100, { message: "Age must be at most 100." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
});

const LocationLanguageSchema = z.object({
  country: z.string().min(1, { message: "Please select a country." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  preferredLanguage: z.string().min(1, { message: "Please select a preferred language." }),
});

const EducationCategorySchema = z.object({
    educationCategory: z.enum(["board", "competitive", "university", "other"], {
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
      examType: z.string().optional(), // e.g. Central Govt, State Govt
      specificExam: z.string().optional(), // e.g. JEE, NEET, TNPSC
    }).optional(),
    universityExams: z.object({
      universityName: z.string().optional(),
      collegeName: z.string().optional(),
      course: z.string().optional(),
      currentYear: z.string().optional(),
    }).optional(),
  }).optional(),
});


const FormSchema = PersonalDetailsSchema.merge(LocationLanguageSchema).merge(EducationCategorySchema).merge(EducationDetailsSchema);

const defaultValues: UserProfile = {
  name: "",
  age: "",
  gender: "",
  country: "",
  state: "",
  preferredLanguage: "",
  educationCategory: "",
  educationQualification: {},
};

export function OnboardingForm() {
  const { setProfile } = useUserProfile();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("personal");

  const form = useForm<UserProfile>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: "onChange", // Validate on change for better UX
  });

  const watchedEducationCategory = form.watch("educationCategory");

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
    } else if (currentStep === "educationCategory") {
      isValid = await form.trigger(["educationCategory"]);
    } else if (currentStep === "educationDetails") {
      // Dynamic validation based on category could be complex, basic trigger for now
      isValid = await form.trigger(["educationQualification"]);
       if (watchedEducationCategory === "board") {
        isValid = isValid && !!form.getValues("educationQualification.boardExams.board") && !!form.getValues("educationQualification.boardExams.standard");
      } else if (watchedEducationCategory === "competitive") {
        isValid = isValid && !!form.getValues("educationQualification.competitiveExams.examType") && !!form.getValues("educationQualification.competitiveExams.specificExam");
      } else if (watchedEducationCategory === "university") {
        isValid = isValid && !!form.getValues("educationQualification.universityExams.universityName") && !!form.getValues("educationQualification.universityExams.course") && !!form.getValues("educationQualification.universityExams.currentYear");
      } else {
        // "Other" category, no specific fields required
        isValid = true;
      }
    }


    if (isValid) {
      const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
      if (currentIndex < onboardingSteps.length - 1) {
        setCurrentStep(onboardingSteps[currentIndex + 1].id);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(onboardingSteps[currentIndex - 1].id);
    }
  };

  function onSubmit(data: UserProfile) {
    const finalProfile: UserProfile = {
      ...data,
      age: Number(data.age), // Ensure age is number
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

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">Welcome to EduAI!</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Let's personalize your learning experience. ({onboardingSteps.findIndex(s => s.id === currentStep) + 1} of {onboardingSteps.length})
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
                        <Input type="number" placeholder="E.g., 18" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormLabel>Preferred Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            
            {currentStep === "educationCategory" && (
                 <FormField
                  control={form.control}
                  name="educationCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is your primary education focus?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as EducationCategory}>
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
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Board (e.g., CBSE)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {CENTRAL_BOARDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                                <SelectItem value="State Board">State Board (Please specify if needed)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="educationQualification.boardExams.standard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standard</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Exam Category (e.g., Central, State)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Central">Central Government Exams</SelectItem>
                                <SelectItem value="State">State Government Exams</SelectItem>
                                <SelectItem value="Other">Other Competitive Exams</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch("educationQualification.competitiveExams.examType") === "Central" && (
                       <FormField
                        control={form.control}
                        name="educationQualification.competitiveExams.specificExam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Central Exam</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Specific Exam" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMPETITIVE_EXAM_TYPES_CENTRAL.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormDescription>If 'Other', please specify below.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                     {form.watch("educationQualification.competitiveExams.examType") === "State" && (
                       <FormField
                        control={form.control}
                        name="educationQualification.competitiveExams.specificExam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific State Exam</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Specific Exam" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMPETITIVE_EXAM_TYPES_STATE.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormDescription>If 'Other', please specify below.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {(form.watch("educationQualification.competitiveExams.specificExam") === "Other" || form.watch("educationQualification.competitiveExams.examType") === "Other") && (
                        <FormField
                          control={form.control}
                          name="educationQualification.competitiveExams.specificExam"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Name / Job Position</FormLabel>
                              <FormControl>
                                <Input placeholder="E.g., Custom Exam Name" {...field} />
                              </FormControl>
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
                            <Input placeholder="E.g., Stanford University" {...field} />
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
                            <Input placeholder="E.g., College of Engineering" {...field} />
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
                            <Input placeholder="E.g., Computer Science" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <p className="text-sm text-muted-foreground">No specific details required for this category. You can proceed.</p>
                )}
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-4 p-4 border rounded-md shadow-sm bg-card">
                <h3 className="text-xl font-semibold text-primary">Review Your Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {form.getValues("name")}</p>
                  <p><strong>Age:</strong> {form.getValues("age")}</p>
                  <p><strong>Gender:</strong> {GENDERS.find(g => g.value === form.getValues("gender"))?.label}</p>
                  <p><strong>Country:</strong> {COUNTRIES.find(c => c.value === form.getValues("country"))?.label}</p>
                  <p><strong>State:</strong> {form.getValues("state")}</p>
                  <p><strong>Preferred Language:</strong> {LANGUAGES.find(l => l.value === form.getValues("preferredLanguage"))?.label}</p>
                  <p><strong>Education Focus:</strong> {EDUCATION_CATEGORIES.find(ec => ec.value === watchedEducationCategory)?.label}</p>
                  {watchedEducationCategory === "board" && form.getValues("educationQualification.boardExams") && (
                    <>
                      <p><strong>Board:</strong> {form.getValues("educationQualification.boardExams.board")}</p>
                      <p><strong>Standard:</strong> {form.getValues("educationQualification.boardExams.standard")}</p>
                    </>
                  )}
                  {watchedEducationCategory === "competitive" && form.getValues("educationQualification.competitiveExams") && (
                    <>
                      <p><strong>Exam Type:</strong> {form.getValues("educationQualification.competitiveExams.examType")}</p>
                      <p><strong>Specific Exam:</strong> {form.getValues("educationQualification.competitiveExams.specificExam")}</p>
                    </>
                  )}
                  {watchedEducationCategory === "university" && form.getValues("educationQualification.universityExams") && (
                    <>
                      <p><strong>University:</strong> {form.getValues("educationQualification.universityExams.universityName")}</p>
                      <p><strong>College:</strong> {form.getValues("educationQualification.universityExams.collegeName")}</p>
                      <p><strong>Course:</strong> {form.getValues("educationQualification.universityExams.course")}</p>
                      <p><strong>Year:</strong> {form.getValues("educationQualification.universityExams.currentYear")}</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Please review your details carefully. You can go back to make changes.</p>
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
            className="gap-1"
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
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="gap-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              Complete Setup
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
    </Card>
  );
}
