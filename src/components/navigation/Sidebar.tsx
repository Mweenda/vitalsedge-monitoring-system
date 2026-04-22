import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Activity,
  Heart,
  Users,
  Calendar,
  Settings,
  FileText,
  Shield,
  Database,
  TrendingUp,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Patient Overview',
    icon: <Heart className="h-5 w-5" />,
    path: '/dashboard'
  },
  {
    id: 'patients',
    label: 'Patient Records',
    icon: <Users className="h-5 w-5" />,
    path: '/patients'
  },
  {
    id: 'vitals',
    label: 'Vital Signs',
    icon: <Activity className="h-5 w-5" />,
    path: '/vitals'
  },
  {
    id: 'trends',
    label: 'Historical Trends',
    icon: <TrendingUp className="h-5 w-5" />,
    path: '/trends'
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: <Calendar className="h-5 w-5" />,
    path: '/appointments'
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    icon: <FileText className="h-5 w-5" />,
    path: '/audit'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings'
  }
];

const secondaryItems: NavigationItem[] = [
  {
    id: 'clinic',
    label: 'Clinic Overview',
    icon: <Database className="h-5 w-5" />,
    path: '/clinic'
  },
  {
    id: 'clinicians',
    label: 'Clinician Management',
    icon: <Shield className="h-5 w-5" />,
    path: '/clinicians'
  },
  {
    id: 'system',
    label: 'System Logs',
    icon: <FileText className="h-5 w-5" />,
    path: '/system'
  }
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className,
  collapsed = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={clsx(
      'flex h-full w-64 flex-col bg-white border-r border-gray-200',
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">VitalsEdge</h1>
        <p className="text-sm text-gray-600 mt-1">Monitoring System</p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main Navigation
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h2>
          <div className="space-y-1">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900 border border-gray-300'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
