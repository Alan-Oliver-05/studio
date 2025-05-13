
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
            - Removed sm:py-4 to make AppHeader sit at the very top of this container.
            - sm:gap-4 will provide space between AppHeader and main.
            - Dynamic md:pl still correctly offsets for the sidebar.
        */}
        <div className="flex flex-col flex-1 sm:gap-4 md:pl-[calc(var(--sidebar-width-icon))] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out">
          <AppHeader />
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

