import React from "react";
import { Activity, Home, LayoutDashboard, Menu } from "lucide-react";
import { clsx } from "clsx";

export interface TopNavProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  activeTab?: string;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  subtitle,
  actions,
  activeTab,
  onNavigateHome,
  onNavigateDashboard,
  onToggleSidebar,
  isSidebarOpen,
}) => (
  <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {/* Hamburger menu button */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className={clsx(
            "rounded-lg p-2 transition-colors lg:hidden",
            isSidebarOpen
              ? 'bg-cyan-100 text-cyan-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isSidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500 shadow-md"
        aria-hidden
      >
        <Activity className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold leading-tight text-gray-800 sm:text-xl">
          VitalsEdge
        </h1>
        {subtitle && (
          <p className="truncate text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Navigation links */}
      <div className="hidden lg:flex items-center gap-1 ml-8">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'home'
                ? 'bg-cyan-50 text-cyan-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        )}
        {onNavigateDashboard && (
          <button
            onClick={onNavigateDashboard}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'overview'
                ? 'bg-cyan-50 text-cyan-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
        )}
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      {actions}
    </div>
  </header>
);
