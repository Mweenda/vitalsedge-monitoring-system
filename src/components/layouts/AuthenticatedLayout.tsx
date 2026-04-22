import React, { useState, useRef, useEffect } from "react";
import { TopNav } from "../navigation/TopNav";
import { SidebarDrawer } from "../navigation/SidebarDrawer";

export interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  title: string;
  subtitle?: string;
  topNavActions?: React.ReactNode;
  activeTab?: string;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  sidebar,
  title,
  subtitle,
  topNavActions,
  activeTab,
  onNavigateHome,
  onNavigateDashboard,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [hasScroll, setHasScroll] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const handleScroll = () => {
      setHasScroll(main.scrollTop > 0);
    };

    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  return (
  <div
    className="min-h-screen bg-neutral-50 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
    data-testid="clinician-dashboard"
  >
    <TopNav
      title={title}
      subtitle={subtitle}
      actions={topNavActions}
      activeTab={activeTab}
      onNavigateHome={onNavigateHome}
      onNavigateDashboard={onNavigateDashboard}
      onToggleSidebar={onToggleSidebar}
      isSidebarOpen={isSidebarOpen}
    />

    {/* Mobile: slide-over drawer. Desktop: persistent aside (no duplicate mount). */}
    <div className="lg:hidden">
      {onToggleSidebar && (
        <SidebarDrawer isOpen={isSidebarOpen ?? false} onClose={onToggleSidebar}>
          {sidebar}
        </SidebarDrawer>
      )}
    </div>

    <div className="flex pt-16">
      <aside
        className="fixed bottom-0 left-0 top-16 z-20 hidden w-80 flex-col overflow-hidden border-r border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:flex"
        aria-label="Main navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col">{sidebar}</div>
      </aside>

      <main 
        ref={mainRef}
        className="relative min-h-[calc(100dvh-4rem)] w-full flex-1 p-4 sm:p-6 lg:ml-80 lg:p-8"
      >
        {/* Scroll gradient indicator */}
        {hasScroll && (
          <div className="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 opacity-50 z-30 pointer-events-none" />
        )}
        <div className="mx-auto w-full max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  </div>
  );
};
