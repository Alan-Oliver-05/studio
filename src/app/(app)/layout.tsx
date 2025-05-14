
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      {/* Changed flex-col to flex (which defaults to flex-row) */}
      <div className="flex min-h-screen w-full bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col flex-1 md:pl-[calc(var(--sidebar-width-icon))] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out">
          {/* AppHeader is now a direct child, removed its wrapper div */}
          <AppHeader />
          <main className="flex-1 px-4 md:px-6 pb-4 md:pb-0 mt-0 pt-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
