
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  LibraryBig,
  PenSquare,
  Brain,
  Settings,
  GraduationCap,
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
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/study-session", icon: BookOpen, label: "Study Session", isDynamic: true }, // isDynamic indicates base path
  { href: "/library", icon: LibraryBig, label: "Library" },
  { href: "/homework-assistant", icon: PenSquare, label: "Homework Helper" },
  { href: "/general-tutor", icon: Brain, label: "General Tutor" },
];

const settingsItem = { href: "/settings", icon: Settings, label: "Settings" };


export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar(); // Get sidebar state

  const isNavItemActive = (itemHref: string, isDynamic?: boolean) => {
    if (isDynamic) {
      return pathname.startsWith(itemHref);
    }
    return pathname === itemHref;
  };
  
  const sidebarOpen = sidebarState === "expanded";

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          {sidebarOpen && <span className="text-xl font-semibold text-primary">EduAI</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            // Hide "Study Session" from sidebar if it's dynamic, users navigate via dashboard
            if (item.isDynamic && item.href === "/study-session") return null;
            
            return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={isNavItemActive(item.href, item.isDynamic)}
                  tooltip={sidebarOpen ? undefined : item.label}
                  className="justify-start"
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
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
                    <settingsItem.icon className="h-5 w-5" />
                     {sidebarOpen && <span>{settingsItem.label}</span>}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
