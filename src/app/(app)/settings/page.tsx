
"use client";

import { useState } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle2, Loader2, AlertTriangle, SettingsIcon, GraduationCap, MapPin, LanguagesIcon, Edit3, Bell, KeyRound, LogOut, BookOpen, ListChecks, PenSquare, Brain, PieChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


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
  const { profile, isLoading, setProfile } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [notificationPreference, setNotificationPreference] = useState<string>("daily");

  const [remindIncompleteStudy, setRemindIncompleteStudy] = useState(true);
  const [remindPendingTodos, setRemindPendingTodos] = useState(true);
  const [remindHomeworkHelper, setRemindHomeworkHelper] = useState(true);
  const [remindGeneralTutor, setRemindGeneralTutor] = useState(true);
  const [remindLanguageTranslator, setRemindLanguageTranslator] = useState(true); // Renamed
  const [remindVisualLearning, setRemindVisualLearning] = useState(true);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-0">
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

  const handlePasswordReset = () => {
    toast({
      title: "Password Reset Requested",
      description: "If this account exists, a password reset link would be sent to your email (feature is illustrative).",
    });
  };

  const handleLogout = () => {
    setProfile(null); 
    router.push('/onboarding');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };


  return (
    <div className="pb-8 pt-0">
       <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-0">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
              <SettingsIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> User Settings
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Manage your profile and app preferences.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/onboarding">
              <Edit3 className="mr-2 h-4 w-4"/> Update Profile
            </Link>
          </Button>
      </div>

      <Card className="shadow-xl max-w-3xl mx-auto">
        <CardHeader className="items-center text-center border-b pb-6">
           <Avatar className="h-24 w-24 mb-4 border-4 border-primary shadow-md">
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

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-primary flex items-center mb-2"><Bell className="mr-2 h-5 w-5"/>Notification Preferences</h3>
            
            <div className="mb-6">
              <Label className="text-md font-medium text-muted-foreground mb-2 block">Overall Summary Frequency</Label>
              <RadioGroup value={notificationPreference} onValueChange={setNotificationPreference} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="font-normal">Daily Summaries</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="font-normal">Weekly Summaries</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="off" id="off" />
                  <Label htmlFor="off" className="font-normal">Turn Off Summaries</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-md font-medium text-muted-foreground mb-3 block">Specific Reminders</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindIncompleteStudy" className="flex items-center font-normal">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" /> Incomplete Study Q&A
                  </Label>
                  <Switch id="remindIncompleteStudy" checked={remindIncompleteStudy} onCheckedChange={setRemindIncompleteStudy} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindPendingTodos" className="flex items-center font-normal">
                    <ListChecks className="mr-2 h-4 w-4 text-primary" /> Pending To-Do Items
                  </Label>
                  <Switch id="remindPendingTodos" checked={remindPendingTodos} onCheckedChange={setRemindPendingTodos} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindHomeworkHelper" className="flex items-center font-normal">
                    <PenSquare className="mr-2 h-4 w-4 text-primary" /> Unfinished Homework Helper
                  </Label>
                  <Switch id="remindHomeworkHelper" checked={remindHomeworkHelper} onCheckedChange={setRemindHomeworkHelper} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindGeneralTutor" className="flex items-center font-normal">
                    <Brain className="mr-2 h-4 w-4 text-primary" /> Unfinished General Tutor
                  </Label>
                  <Switch id="remindGeneralTutor" checked={remindGeneralTutor} onCheckedChange={setRemindGeneralTutor} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindLanguageTranslator" className="flex items-center font-normal"> {/* Renamed ID and label */}
                    <LanguagesIcon className="mr-2 h-4 w-4 text-primary" /> Unfinished Language Translation
                  </Label>
                  <Switch id="remindLanguageTranslator" checked={remindLanguageTranslator} onCheckedChange={setRemindLanguageTranslator} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <Label htmlFor="remindVisualLearning" className="flex items-center font-normal">
                    <PieChartIcon className="mr-2 h-4 w-4 text-primary" /> Unfinished Visual Learning
                  </Label>
                  <Switch id="remindVisualLearning" checked={remindVisualLearning} onCheckedChange={setRemindVisualLearning} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Notification settings are for demonstration (UI only).</p>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-xl font-semibold text-primary flex items-center mb-4"><UserCircle2 className="mr-2 h-5 w-5"/>Account Actions</h3>
            <Button variant="outline" onClick={handlePasswordReset} className="w-full sm:w-auto">
              <KeyRound className="mr-2 h-4 w-4"/> Reset Password
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center pt-4 border-t mt-6">
            Profile information is used to personalize your learning experience. To update these details, please go through the onboarding process again via the "Update Profile" button.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
