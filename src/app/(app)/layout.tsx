import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col flex-1 md:pl-[calc(var(--sidebar-width-icon))] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out">
          <AppHeader />
          <main className="flex-1 p-2 sm:p-4 md:p-6 md:gap-8 overflow-auto"> {/* Adjusted padding */}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

