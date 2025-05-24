
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
        "bg-background" 
        )}>
        <SidebarNav />
        <div className="flex flex-col flex-1 min-w-0"> {/* Added min-w-0 here for flexbox safety */}
          <AppHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-6 pb-6 pt-4"> {/* Changed padding & scroll behavior */}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
