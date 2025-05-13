
"use client";

import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, Loader2, AlertTriangle, SettingsIcon, GraduationCap, MapPin, LanguagesIcon, BookCopy, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";


const DetailItem = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/50">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground">{String(value)}</dd>
    </div>
  );
};


export default function SettingsPage() {
  const { profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-3">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
         We couldn't find your profile details. Please complete the onboarding process to view your settings.
        </p>
        <Button asChild size="lg">
          <Link href="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  const educationCategoryLabel = EDUCATION_CATEGORIES.find(cat => cat.value === profile.educationCategory)?.label || "N/A";
  const genderLabel = GENDERS.find(g => g.value === profile.gender)?.label || profile.gender;
  const countryLabel = COUNTRIES.find(c => c.value === profile.country)?.label || profile.country;
  const languageLabel = LANGUAGES.find(lang => lang.value === profile.preferredLanguage)?.label || profile.preferredLanguage;


  return (
    <div className="container mx-auto py-8">
       <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center">
              <SettingsIcon className="mr-3 h-10 w-10" /> User Settings
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              View your profile information.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/onboarding">
              <Edit3 className="mr-2 h-4 w-4"/> Update Profile
            </Link>
          </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="items-center text-center border-b pb-6">
           <Avatar className="h-24 w-24 mb-4 border-4 border-primary shadow-md">
            {/* Placeholder for profile picture, if it were implemented */}
            {/* <AvatarImage src={profile.pictureUrl} alt={profile.name} /> */}
            <AvatarFallback className="text-3xl bg-muted">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <UserCircle2 />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">{profile.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">Age: {profile.age}</CardDescription>
          <Badge variant="secondary" className="mt-2">{genderLabel}</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div>
            <h3 className="text-xl font-semibold text-primary flex items-center mb-3"><MapPin className="mr-2 h-5 w-5"/>Location & Language</h3>
            <dl className="space-y-1">
              <DetailItem label="Country" value={countryLabel} />
              <DetailItem label="State/Province" value={profile.state} />
              <DetailItem label="Preferred Language" value={languageLabel} />
            </dl>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-primary flex items-center mb-3"><GraduationCap className="mr-2 h-5 w-5"/>Education Background</h3>
            <dl className="space-y-1">
               <DetailItem label="Primary Focus" value={educationCategoryLabel} />
              {profile.educationCategory === "board" && profile.educationQualification.boardExams && (
                <>
                  <DetailItem label="Board Name" value={profile.educationQualification.boardExams.board} />
                  <DetailItem label="Standard" value={profile.educationQualification.boardExams.standard} />
                </>
              )}
              {profile.educationCategory === "competitive" && profile.educationQualification.competitiveExams && (
                <>
                  <DetailItem label="Exam Category" value={profile.educationQualification.competitiveExams.examType} />
                  <DetailItem label="Specific Exam/Job" value={profile.educationQualification.competitiveExams.specificExam} />
                </>
              )}
              {profile.educationCategory === "university" && profile.educationQualification.universityExams && (
                <>
                  <DetailItem label="University Name" value={profile.educationQualification.universityExams.universityName} />
                  <DetailItem label="College Name" value={profile.educationQualification.universityExams.collegeName} />
                  <DetailItem label="Course/Major" value={profile.educationQualification.universityExams.course} />
                  <DetailItem label="Current Year" value={profile.educationQualification.universityExams.currentYear} />
                </>
              )}
            </dl>
          </div>
          <p className="text-sm text-muted-foreground text-center pt-4">
            Profile information is used to personalize your learning experience. To update these details, please go through the onboarding process again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
