
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
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

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/general-tutor", icon: Brain, label: "General Tutor" },
  { href: "/homework-assistant", icon: PenSquare, label: "Homework Helper" },
  { href: "/visual-learning", icon: PieChartIcon, label: "Visual Learning" },
  { href: "/language-learning", icon: Languages, label: "Language Translator" },
  { href: "/summarizer", icon: FileText, label: "Summarizer" },
  { href: "/todo", icon: ListChecks, label: "To-Do List" }, 
  { href: "/notepad", icon: NotebookText, label: "Note Pad" },
  { href: "/library", icon: LibraryBig, label: "Library" },
  { href: "/analytics", icon: BarChartBig, label: "Analytics" },
  // Study Session is dynamic and not listed here if it's purely for navigation target
  // { href: "/study-session", icon: BookOpen, label: "Study Session", isDynamic: true }, 
];

const settingsItem = { href: "/settings", icon: Settings, label: "Settings" };


export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar(); 

  const isNavItemActive = (itemHref: string, isDynamic?: boolean) => {
    if (isDynamic) {
      // For dynamic routes like /study-session/[subject], this ensures the base link is active
      // when any of its sub-routes are active.
      return pathname.startsWith(itemHref);
    }
    return pathname === itemHref;
  };
  
  const sidebarOpen = !isMobile && sidebarState === "expanded";

  return (
    <Sidebar className="border-r border-border/50" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          {sidebarOpen && <span className="text-xl font-bold text-gradient-primary">EduAI</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            // This condition prevents rendering a generic "/study-session" link if it's meant to be dynamic only
            if (item.href === "/study-session" && item.isDynamic) return null; 
            
            const isActive = isNavItemActive(item.href, item.isDynamic);
            return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={sidebarOpen ? undefined : item.label}
                  className="justify-start"
                >
                  <a>
                    <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                    {sidebarOpen && <span className={cn(isActive && "font-semibold")}>{item.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-border/50">
         <SidebarMenu>
            <SidebarMenuItem>
              <Link href={settingsItem.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === settingsItem.href}
                  tooltip={sidebarOpen ? undefined : settingsItem.label}
                  className="justify-start"
                >
                  <a>
                    <settingsItem.icon className={cn("h-5 w-5", pathname === settingsItem.href ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                     {sidebarOpen && <span className={cn(pathname === settingsItem.href && "font-semibold")}>{settingsItem.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
