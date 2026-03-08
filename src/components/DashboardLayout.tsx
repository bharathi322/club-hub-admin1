import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDemo } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {isDemo && (
            <div className="bg-accent text-accent-foreground text-center text-xs py-1 font-medium">
              Demo Mode — using sample data
            </div>
          )}
          <header className="h-12 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <SidebarTrigger className="mr-2" />
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
