
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={cn(
        "flex min-h-screen w-full",
        "bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-muted/10" // Subtle background gradient
        )}>
        <SidebarNav />
        <div className="flex flex-col flex-1 min-w-0"> {/* Added min-w-0 here for flexbox safety */}
          <AppHeader />
          <main className="flex-1 overflow-auto px-4 md:pr-6 md:pl-0 pb-4 md:pb-6 pt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
