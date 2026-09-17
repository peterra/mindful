import { DesktopSidebar, MobileBottomNav, MobileTopBar } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 pb-16 md:pb-0">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
