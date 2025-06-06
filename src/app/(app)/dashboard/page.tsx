
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
import { Loader2, BookOpen, AlertTriangle, Sparkles, ChevronRight, Presentation } from "lucide-react";
import Image from "next/image";

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
  
  if (error && subjects.length === 0) { // Show error only if no subjects are loaded
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
    <div className="pt-0">
      <div className="mb-6 text-center pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-primary mt-0">Welcome, {profile.name}!</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-2">Here are your personalized study recommendations.</p>
      </div>
      {subjects.length === 0 && !isLoadingSubjects && (
        <Card className="text-center py-8 shadow-lg max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-4">
            <div className="mx-auto bg-accent/10 rounded-full p-3 w-fit">
             <Sparkles className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Subjects Found Yet</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              We couldn't find any specific subject recommendations for you at the moment.
              This might be due to your unique profile combination or a temporary issue.
              You can still explore general topics using our AI Tutor or try reloading.
            </p>
          </CardContent>
          <CardFooter className="justify-center p-4 gap-2">
             <Button asChild variant="default">
                <Link href="/general-tutor">Explore General Tutor</Link>
             </Button>
             <Button onClick={() => window.location.reload()} variant="outline">Reload Subjects</Button>
          </CardFooter>
        </Card>
      )}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => (
            <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/50">
              <CardHeader className="p-4 pb-2">
                <div className="relative h-40 w-full mb-3 rounded-lg overflow-hidden group">
                  <Image 
                    src={`https://placehold.co/600x300.png`} 
                    alt={subject.name} 
                    fill
                    style={{ objectFit: "cover" }}
                    data-ai-hint={subject.name.toLowerCase().includes("math") ? "mathematics abstract" : subject.name.toLowerCase().includes("physics") ? "physics science" : subject.name.toLowerCase().includes("history") ? "history books" : "education study"}
                    className="transition-transform duration-300 group-hover:scale-105"
                    priority={index < 3} // Prioritize loading images for first few cards
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                   <div className="absolute bottom-2 left-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center">
                       <Presentation className="w-3 h-3 mr-1.5" />
                       Personalized
                   </div>
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">{subject.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground h-16 line-clamp-3">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-4 pt-2">
                {subject.studyMaterials && subject.studyMaterials.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1.5 text-sm text-primary">Key Topics:</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {subject.studyMaterials.slice(0, 3).map((material, i) => (
                        <li key={i} className="truncate">{material}</li>
                      ))}
                       {subject.studyMaterials.length > 3 && <li className="italic">...and more</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-2 border-t mt-auto">
                <Button asChild className="w-full" variant="default">
                  <Link
                    href={`/study-session/${encodeURIComponent(subject.name)}`}
                  >
                    <BookOpen className="mr-2 h-4 w-4" /> Start Studying <ChevronRight className="ml-auto h-4 w-4"/>
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
