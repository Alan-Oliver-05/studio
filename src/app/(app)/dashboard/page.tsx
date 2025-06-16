
 "use client";

import { useEffect, useState }
from "react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/user-profile-context";
import { generatePersonalizedSubjects, GeneratePersonalizedSubjectsInput } from "@/ai/flows/generate-personalized-subjects";
import type { Subject } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BookOpen, AlertTriangle, Sparkles, ChevronRight, Presentation, Rocket, Target, Lightbulb } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileLoading) { 
      if (profile && profile.name) {
        
        setIsLoadingSubjects(true); 
        setError(null);
        const fetchSubjects = async () => {
          try {
            const input: GeneratePersonalizedSubjectsInput = {
              name: profile.name,
              age: Number(profile.age), 
              gender: profile.gender,
              country: profile.country,
              state: profile.state,
              preferredLanguage: profile.preferredLanguage,
              educationQualification: { 
                boardExams: profile.educationCategory === "board" ? profile.educationQualification?.boardExams : undefined,
                competitiveExams: profile.educationCategory === "competitive" ? profile.educationQualification?.competitiveExams : undefined,
                universityExams: profile.educationCategory === "university" ? profile.educationQualification?.universityExams : undefined,
              },
            };
            
            const result = await generatePersonalizedSubjects(input);
            if (result && result.subjects) {
              setSubjects(result.subjects);
            } else {
              setSubjects([]); 
              setError("AI could not generate subjects for your profile. This might be due to a unique profile combination. Please try the General Tutor or check your profile settings.");
            }
          } catch (e) {
            console.error("Failed to fetch subjects:", e);
            setError("Failed to load personalized subjects. Please try again later.");
            setSubjects([]);
          } finally {
            setIsLoadingSubjects(false);
          }
        };
        fetchSubjects();
      } else {
        setSubjects([]); 
        setIsLoadingSubjects(false); 
         if (!profile) setError("Profile not available. Please complete onboarding to see personalized subjects.");
      }
    } else {
      setSubjects([]); 
      setIsLoadingSubjects(true); 
      setError(null); 
    }
  }, [profile, profileLoading]);

  if (profileLoading || isLoadingSubjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.20))] mt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your personalized dashboard...</p>
      </div>
    );
  }

  if (error && (!profile || !profile.name)) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.20))] text-center mt-0 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Profile Issue</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button asChild>
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  if (!profile || !profile.name) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.20))] text-center mt-0 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4 max-w-md">We couldn't find your profile. Please complete the onboarding process.</p>
        <Button asChild>
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  if (error && subjects.length === 0) { 
     return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Subject Loading Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
         <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/general-tutor">Explore General Tutor</Link>
            </Button>
        </div>
      </Alert>
    );
  }


  return (
    <div className="pt-0 pb-8">
      <div className="mb-8 text-center pt-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-primary mt-0">Welcome, {profile.name}!</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-2 max-w-xl mx-auto">
          Your personalized learning journey starts here. Explore subjects tailored just for you.
        </p>
      </div>
      {subjects.length === 0 && !isLoadingSubjects && (
        <Card className="text-center py-10 shadow-lg max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-4">
            <div className="mx-auto bg-accent/10 rounded-full p-4 w-fit">
             <Lightbulb className="h-12 w-12 text-accent" />
            </div>
            <CardTitle className="mt-6 text-2xl">No Personalized Subjects Yet</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              It seems we couldn't generate specific subject recommendations based on your profile right now.
              Don't worry! You can still explore a wide range of topics with our General AI Tutor or try reloading.
            </p>
          </CardContent>
          <CardFooter className="justify-center p-4 gap-3">
             <Button asChild variant="default" size="lg">
                <Link href="/general-tutor"><Rocket className="mr-2 h-5 w-5"/> Explore General Tutor</Link>
             </Button>
             <Button onClick={() => window.location.reload()} variant="outline" size="lg">Reload Subjects</Button>
          </CardFooter>
        </Card>
      )}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => (
            <Card 
              key={index} 
              className={cn(
                "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out",
                "bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/60 hover:scale-[1.02]"
              )}
            >
              <CardHeader className="p-0">
                <div className="relative aspect-[16/10] w-full group">
                  <Image 
                    src={`https://placehold.co/600x375.png`} 
                    alt={subject.name} 
                    fill
                    style={{ objectFit: "cover" }}
                    data-ai-hint={subject.name.toLowerCase().includes("math") ? "abstract mathematics" : subject.name.toLowerCase().includes("physics") ? "science experiment" : subject.name.toLowerCase().includes("history") ? "historical artifacts" : "study books"}
                    className="transition-transform duration-300 group-hover:scale-105 rounded-t-lg"
                    priority={index < 3} 
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-t-lg"></div>
                   <div className="absolute bottom-3 left-3 bg-primary/80 text-primary-foreground text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center shadow-md">
                       <Target className="w-3.5 h-3.5 mr-1.5" />
                       Tailored for You
                   </div>
                </div>
              </CardHeader>
              <div className="p-5 flex flex-col flex-grow">
                <CardTitle className="text-xl font-semibold text-foreground mb-1.5">{subject.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-4 h-16 line-clamp-3">{subject.description}</CardDescription>
              
                {subject.studyMaterials && subject.studyMaterials.length > 0 && (
                  <div className="mb-5">
                    <h4 className="font-semibold mb-1.5 text-sm text-primary">Key Focus Areas:</h4>
                    <ul className="space-y-1">
                      {subject.studyMaterials.slice(0, 3).map((material, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center">
                           <ChevronRight className="w-3 h-3 mr-1 text-primary/70 flex-shrink-0"/> 
                           <span className="truncate">{material}</span>
                        </li>
                      ))}
                       {subject.studyMaterials.length > 3 && <li className="text-xs italic text-muted-foreground/80 pl-4">...and more topics</li>}
                    </ul>
                  </div>
                )}
              </div>
              <CardFooter className="p-5 pt-0 mt-auto border-t">
                <Button asChild className="w-full" variant="default" size="lg">
                  <Link
                    href={`/study-session/${encodeURIComponent(subject.name)}`}
                    className="group"
                  >
                    <BookOpen className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:scale-110" /> 
                    Start Learning 
                    <ChevronRight className="ml-auto h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
