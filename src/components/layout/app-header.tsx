"use client";

import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggleButton } from "./theme-toggle-button"; // Added import
import { useUserProfile } from "@/contexts/user-profile-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle2 } from "lucide-react";

export function AppHeader() {
  const { profile } = useUserProfile(); // No need for isLoading here

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div>
        <SidebarTrigger />
      </div>
      <Link
        href="/dashboard">
        <div className="flex items-center gap-2 text-lg font-semibold ">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-gradient-primary font-bold">EduAI Tutor</span>
        </div>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggleButton />
        {profile && (
           <Link href="/settings">
            <Avatar className="h-8 w-8 cursor-pointer border-2 border-primary/50 hover:border-primary transition-colors">
                <AvatarFallback className="text-sm bg-muted text-muted-foreground">
                {profile.name ? profile.name.charAt(0).toUpperCase() : <UserCircle2 className="h-5 w-5"/>}
                </AvatarFallback>
            </Avatar>
           </Link>
        )}
      </div>
    </header>
  );
}
