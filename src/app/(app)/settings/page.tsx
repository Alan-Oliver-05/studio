
"use client";

import { useState, useEffect } from "react"; 
import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle2, Loader2, AlertTriangle, SettingsIcon, GraduationCap, MapPin, LanguagesIcon, Edit3, Bell, KeyRound, LogOut, BookOpen, ListChecks, PenSquare, Brain, PieChartIcon, User as UserIcon, Palette, Trash2 } from "lucide-react"; // Added Palette & Trash2
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GENDERS, COUNTRIES, LANGUAGES, EDUCATION_CATEGORIES, LEARNING_STYLES } from "@/lib/constants"; // Added LEARNING_STYLES
import { deleteAllConversations } from "@/lib/chat-storage"; // Import deleteAllConversations
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


const DetailItem = ({ label, value, icon }: { label: string; value: string | number | undefined | null; icon?: React.ReactNode }) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  return (
    <div className="flex items-start py-3 border-b border-border/30 last:border-b-0">
      {icon && <span className="mr-3 mt-0.5 text-muted-foreground flex-shrink-0">{icon}</span>}
      <div className="flex-grow">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground">{String(value)}</dd>
      </div>
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
  const [remindVisualLearning, setRemindVisualLearning] = useState(true);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  if (isLoading || !isClient) {
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
  const learningStyleLabel = LEARNING_STYLES.find(ls => ls.value === profile.learningStyle)?.label || "Balanced";


  const handlePasswordReset = () => {
    toast({
      title: "Password Reset Action",
      description: "This is a placeholder for password reset functionality. In a real app, this would trigger an email or other reset flow.",
    });
  };

  const handleLogout = () => {
    setProfile(null); 
    // Clear relevant parts of localStorage to ensure a clean slate for onboarding
    localStorage.removeItem('userProfile');
    // Optionally, clear other related items like chat history, tasks, notes if stored locally
    // localStorage.removeItem('chatHistory'); 
    // localStorage.removeItem('userTasks');
    // localStorage.removeItem('userNotes');
    // If needed, clear everything: localStorage.clear(); 
    
    router.push('/onboarding');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out. All local data has been cleared.",
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
         <Button variant="outline" asChild className="shadow-sm">
           <Link href="/onboarding">
             <Edit3 className="mr-2 h-4 w-4"/> Update Profile
           </Link>
         </Button>
     </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl bg-card/90 backdrop-blur-sm">
            <CardHeader className="items-center text-center border-b pb-4">
               <Avatar className="h-24 w-24 mb-3 border-4 border-primary/70 shadow-lg">
                <AvatarFallback className="text-4xl bg-primary/10 text-primary font-semibold">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <UserIcon />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold text-primary">{profile.name}</CardTitle>
              <CardDescription className="text-md text-muted-foreground">Age: {profile.age}</CardDescription>
              <div className="flex flex-wrap justify-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-xs">{genderLabel}</Badge>
                <Badge variant="outline" className="text-xs">{learningStyleLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
                <DetailItem label="Country" value={countryLabel} icon={<MapPin className="h-4 w-4"/>}/>
                <DetailItem label="State/Province" value={profile.state} icon={<MapPin className="h-4 w-4 opacity-0"/>} /> 
                <DetailItem label="Preferred Language" value={languageLabel} icon={<LanguagesIcon className="h-4 w-4"/>} />
                <DetailItem label="Preferred Learning Style" value={learningStyleLabel} icon={<Palette className="h-4 w-4"/>} />
                <DetailItem label="Primary Focus" value={educationCategoryLabel} icon={<GraduationCap className="h-4 w-4"/>} />
                
                {profile.educationCategory === "board" && profile.educationQualification.boardExams && (
                <div className="pl-7 space-y-1 text-xs">
                  <DetailItem label="Board" value={profile.educationQualification.boardExams.board} />
                  <DetailItem label="Standard" value={profile.educationQualification.boardExams.standard} />
                </div>
                )}
                {profile.educationCategory === "competitive" && profile.educationQualification.competitiveExams && (
                 <div className="pl-7 space-y-1 text-xs">
                    <DetailItem label="Exam Category" value={profile.educationQualification.competitiveExams.examType} />
                    <DetailItem label="Specific Exam/Job" value={profile.educationQualification.competitiveExams.specificExam} />
                </div>
                )}
                {profile.educationCategory === "university" && profile.educationQualification.universityExams && (
                 <div className="pl-7 space-y-1 text-xs">
                    <DetailItem label="University" value={profile.educationQualification.universityExams.universityName} />
                    {profile.educationQualification.universityExams.collegeName && <DetailItem label="College" value={profile.educationQualification.universityExams.collegeName} />}
                    <DetailItem label="Course/Major" value={profile.educationQualification.universityExams.course} />
                    <DetailItem label="Current Year" value={profile.educationQualification.universityExams.currentYear} />
                 </div>
                )}
            </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-primary"><Bell className="mr-2 h-5 w-5"/>Notification Preferences</CardTitle>
                    <CardDescription>Customize how you receive updates and reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">Overall Summary Frequency</Label>
                        <RadioGroup value={notificationPreference} onValueChange={setNotificationPreference} className="space-y-1.5">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="daily" id="daily" /><Label htmlFor="daily" className="font-normal text-sm">Daily Summaries</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="weekly" id="weekly" /><Label htmlFor="weekly" className="font-normal text-sm">Weekly Summaries</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="off" id="off" /><Label htmlFor="off" className="font-normal text-sm">Turn Off Summaries</Label></div>
                        </RadioGroup>
                    </div>
                     <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-3 block">Specific Feature Reminders</Label>
                        <div className="space-y-2.5">
                            {[
                                {id: "remindIncompleteStudy", label:"Incomplete Study Q&A", icon: BookOpen, state: remindIncompleteStudy, setState: setRemindIncompleteStudy},
                                {id: "remindPendingTodos", label:"Pending To-Do Items", icon: ListChecks, state: remindPendingTodos, setState: setRemindPendingTodos},
                                {id: "remindHomeworkHelper", label:"Unfinished Homework Helper", icon: PenSquare, state: remindHomeworkHelper, setState: setRemindHomeworkHelper},
                                {id: "remindGeneralTutor", label:"Unfinished AI Assistant Chat", icon: Brain, state: remindGeneralTutor, setState: setRemindGeneralTutor},
                                {id: "remindVisualLearning", label:"Unfinished Visual Learning", icon: PieChartIcon, state: remindVisualLearning, setState: setRemindVisualLearning},
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-md border bg-muted/40">
                                    <Label htmlFor={item.id} className="flex items-center font-normal text-sm cursor-pointer">
                                    <item.icon className="mr-2 h-4 w-4 text-primary/80" /> {item.label}
                                    </Label>
                                    <Switch id={item.id} checked={item.state} onCheckedChange={item.setState} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-3 border-t">Note: Notification settings are for demonstration purposes and are not currently functional.</p>
                </CardContent>
            </Card>
            <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-primary"><UserCircle2 className="mr-2 h-5 w-5"/>Account Actions</CardTitle>
                    <CardDescription>Manage your account settings and activity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" onClick={handlePasswordReset} className="w-full sm:w-auto">
                        <KeyRound className="mr-2 h-4 w-4"/> Reset Password
                    </Button>
                     <Button variant="destructive" onClick={() => setShowClearHistoryDialog(true)} className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4"/> Clear All Chat History
                    </Button>
                    <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4"/> Logout & Clear All Data
                    </Button>
                </CardContent>
                <CardFooter>
                     <p className="text-xs text-muted-foreground">Logging out will clear all your locally stored data, including profile, chat history, tasks, and notes. Clearing chat history only removes conversation data.</p>
                </CardFooter>
            </Card>
        </div>
      </div>
      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete ALL your chat conversations from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAllConversations();
                toast({
                  title: "Chat History Cleared",
                  description: "All your chat conversations have been deleted.",
                });
                setShowClearHistoryDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete All Chat History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-sm text-muted-foreground text-center pt-6 mt-8 border-t border-border/50">
           Profile information is used to personalize your learning experience. To update these details, please go through the onboarding process again via the "Update Profile" button above.
     </p>
    </div>
  );
}

