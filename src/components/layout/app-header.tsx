
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div>
        <SidebarTrigger />
      </div>
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold ">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-gradient-primary font-bold">EduAI</span>
      </Link>
      {/* Future: Add user menu or other header items here */}
    </header>
  );
}
