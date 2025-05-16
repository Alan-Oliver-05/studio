
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-muted/40">
        <SidebarNav /><div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 overflow-auto pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
