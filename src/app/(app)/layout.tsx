
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-muted/40"> {/* Changed from flex-col */}
        <SidebarNav />
        <div className="flex flex-col flex-1 md:pl-[calc(var(--sidebar-width-icon))] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out mt-0 pt-0">
          <AppHeader />
          <main className="flex-1 overflow-auto pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
