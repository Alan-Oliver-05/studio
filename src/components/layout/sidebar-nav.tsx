
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LibraryBig,
  PenSquare,
  Brain,
  NotebookText,
  Settings,
  GraduationCap,
  ListChecks, 
  Languages, 
  BarChartBig,
  PieChartIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/general-tutor", icon: Brain, label: "AI Learning Assistant" },
  { href: "/homework-assistant", icon: PenSquare, label: "Homework Helper" },
  { href: "/visual-learning", icon: PieChartIcon, label: "Visual Learning" },
  { href: "/language-learning", icon: Languages, label: "Language Translator" }, 
  { href: "/summarizer", icon: FileText, label: "AI Note Taker" },
  { href: "/todo", icon: ListChecks, label: "To-Do List" }, 
  { href: "/notepad", icon: NotebookText, label: "Note Pad" },
  { href: "/library", icon: LibraryBig, label: "My Library" },
  { href: "/analytics", icon: BarChartBig, label: "Analytics" },
];

const settingsItem = { href: "/settings", icon: Settings, label: "Settings" };


export function SidebarNav() {
  const pathname = usePathname();
  const { profile } = useUserProfile(); 
  const { state: sidebarState, isMobile } = useSidebar(); 

  const isNavItemActive = (itemHref: string) => {
    if (itemHref === "/dashboard") return pathname === itemHref || pathname === "/";
    // For language-learning, highlight if path starts with /language-learning (covers modes in query params)
    if (itemHref === "/language-learning") return pathname.startsWith("/language-learning"); 
    return pathname.startsWith(itemHref);
  };
  
  const sidebarOpen = !isMobile && sidebarState === "expanded";

  return (
    <Sidebar className="border-r border-sidebar-border shadow-md" collapsible="icon">
      <SidebarHeader className="p-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <GraduationCap className="h-7 w-7 text-primary flex-shrink-0" />
          {sidebarOpen && <span className="text-xl font-bold text-gradient-primary truncate">EduAI Tutor</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={sidebarOpen ? undefined : item.label}
                  className="justify-start group"
                >
                  <a>
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                    {sidebarOpen && <span className={cn("transition-opacity",isActive && "font-semibold")}>{item.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
         <SidebarMenu>
            <SidebarMenuItem>
              <Link href={settingsItem.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === settingsItem.href}
                  tooltip={sidebarOpen ? undefined : settingsItem.label}
                  className="justify-start group"
                >
                  <a>
                    <settingsItem.icon className={cn("h-5 w-5 transition-colors", pathname === settingsItem.href ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                     {sidebarOpen && <span className={cn("transition-opacity",pathname === settingsItem.href && "font-semibold")}>{settingsItem.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            {profile && sidebarOpen && (
              <SidebarMenuItem className="mt-2">
                 <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : <UserCircle2 className="h-4 w-4"/>}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">{profile.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.educationCategory ? EDUCATION_CATEGORIES.find(e => e.value === profile.educationCategory)?.label : 'Learner'}</p>
                    </div>
                 </div>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Helper to find education category label
const EDUCATION_CATEGORIES = [
  { value: "board", label: "School Learner" },
  { value: "competitive", label: "Exam Aspirant" },
  { value: "university", label: "University Student" },
  { value: "other", label: "Learner" },
];
    