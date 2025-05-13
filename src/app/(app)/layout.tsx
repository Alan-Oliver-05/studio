import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        {/* This div wraps the header and main content. 
            - Added flex-1 to make it take available vertical space.
            - Dynamic md:pl still correctly offsets for the sidebar.
        */}
        <div className="flex flex-col flex-1 md:pl-[calc(var(--sidebar-width-icon))] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out">
          <AppHeader />
          <main className="flex-1 px-4 pt-4 pb-4 sm:px-6 sm:pt-0 sm:pb-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
