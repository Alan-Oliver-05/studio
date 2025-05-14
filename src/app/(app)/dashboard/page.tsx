
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
import { Loader2, BookOpen, AlertTriangle, Sparkles } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.name) { // Ensure profile is loaded and valid
      const fetchSubjects = async () => {
        setIsLoadingSubjects(true);
        setError(null);
        try {
          // Map UserProfileType to GeneratePersonalizedSubjectsInput
          const input: GeneratePersonalizedSubjectsInput = {
            name: profile.name,
            age: Number(profile.age), // Ensure age is a number
            gender: profile.gender,
            country: profile.country,
            state: profile.state,
            preferredLanguage: profile.preferredLanguage,
            educationQualification: { // This directly maps if UserProfileType.educationQualification is structured correctly
              boardExams: profile.educationQualification.boardExams,
              competitiveExams: profile.educationQualification.competitiveExams,
              universityExams: profile.educationQualification.universityExams,
            },
          };
          
          const result = await generatePersonalizedSubjects(input);
          if (result && result.subjects) {
            setSubjects(result.subjects);
          } else {
            setSubjects([]); // Handle case where AI returns no subjects
             setError("AI could not generate subjects for your profile. Please try again later or check your profile settings.");
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
    } else if (!profileLoading) {
      setIsLoadingSubjects(false);
    }
  }, [profile, profileLoading]);

  if (profileLoading || isLoadingSubjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.20))] pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your personalized dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-10 pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!profile || !profile.name) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.20))] text-center pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't find your profile. Please complete the onboarding process.</p>
        <Button asChild>
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pr-4 md:pr-6 pb-4 md:pb-6 pt-0"> {/* Added padding here, removed left padding */}
      <div className="mb-6 text-center pt-0">
        <h1 className="text-4xl font-bold tracking-tight text-primary mt-0">Welcome, {profile.name}!</h1>
        <p className="text-xl text-muted-foreground mt-2">Here are your personalized study recommendations.</p>
      </div>

      {subjects.length === 0 && !isLoadingSubjects && (
        <Card className="text-center py-8 shadow-lg max-w-2xl mx-auto">
          <CardHeader className="p-4">
            <div className="mx-auto bg-accent/20 rounded-full p-3 w-fit">
             <Sparkles className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Subjects Found Yet</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              We couldn't find any specific subject recommendations for you at the moment.
              This might be due to your unique profile combination.
              You can still explore general topics using our AI Tutor.
            </p>
          </CardContent>
          <CardFooter className="justify-center p-4">
             <Button asChild variant="outline">
                <Link href="/general-tutor">Explore General Tutor</Link>
             </Button>
          </CardFooter>
        </Card>
      )}

      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, index) => (
            <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-4 pb-2">
                <div className="relative h-40 w-full mb-3 rounded-md overflow-hidden">
                  <Image 
                    src={`https://placehold.co/400x200.png`} 
                    alt={subject.name} 
                    fill
                    style={{ objectFit: "cover" }}
                    data-ai-hint="education abstract"
                  />
                </div>
                <CardTitle className="text-xl font-semibold text-primary">{subject.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground h-12 line-clamp-2">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-4 pt-2">
                {subject.studyMaterials && subject.studyMaterials.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Key Topics:</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {subject.studyMaterials.slice(0, 3).map((material, i) => (
                        <li key={i} className="truncate">{material}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-2">
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href={`/study-session/${encodeURIComponent(subject.name)}`}>
                    <BookOpen className="mr-2 h-4 w-4" /> Start Studying
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
