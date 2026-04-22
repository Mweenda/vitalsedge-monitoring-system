import React from 'react';
import {
  Activity,
  Users,
  TrendingUp,
  Lock,
  Heart,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserRole } from '../types';
import { ThemeCard } from './layout/ThemeCard';

interface HomePageProps {
  fullName?: string;
  role?: UserRole;
  clinicName?: string;
}

interface AccessCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  available: boolean;
}

const ROLE_ACCESS: Record<UserRole | string, AccessCard[]> = {
  CLINICIAN: [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Patient Management',
      description: 'View and manage your assigned patients, vital signs, and medical history',
      available: true,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Trend Analysis',
      description: 'Analyze patient health trends and historical vital sign data',
      available: true,
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'Real-time Alerts',
      description: 'Receive instant notifications for critical vital sign changes',
      available: true,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Audit Trail',
      description: 'Access audit logs for compliance and accountability tracking',
      available: true,
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Profile Management',
      description: 'Update your profile information and preferences',
      available: true,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Device Configuration',
      description: 'Configure monitoring device settings and thresholds',
      available: true,
    },
  ],
  PATIENT: [
    {
      icon: <Heart className="h-5 w-5" />,
      title: 'Health Dashboard',
      description: 'View your personal vital signs and health metrics',
      available: true,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Health Trends',
      description: 'Track your health progress over time',
      available: true,
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'Alert Notifications',
      description: 'Receive alerts about your vital signs',
      available: true,
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Privacy Controls',
      description: 'Manage your data and privacy settings',
      available: true,
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Clinician Access',
      description: 'View and manage which clinicians can see your data',
      available: true,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Access History',
      description: 'See when your clinicians accessed your records',
      available: true,
    },
  ],
  CLINIC_MANAGER: [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Clinic Management',
      description: 'Manage clinicians, patients, and clinic resources',
      available: true,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Analytics & Reports',
      description: 'Generate reports on clinic performance and patient outcomes',
      available: true,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Population Health',
      description: 'Monitor aggregate health trends across your clinic',
      available: true,
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Access Control',
      description: 'Manage user roles and permissions for your clinic',
      available: true,
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'System Alerts',
      description: 'Monitor system health and receive critical alerts',
      available: true,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Audit Logs',
      description: 'Comprehensive audit trail for compliance',
      available: true,
    },
  ],
  ADMIN: [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Platform Administration',
      description: 'Full platform management and user administration',
      available: true,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'System Analytics',
      description: 'Platform-wide analytics and system performance metrics',
      available: true,
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'System Logs',
      description: 'Access detailed system logs and error tracking',
      available: true,
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Security Management',
      description: 'Manage security policies and access controls',
      available: true,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Clinic Oversight',
      description: 'Monitor all clinics and their performance',
      available: true,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Platform Audit Trail',
      description: 'Complete platform-wide audit logging',
      available: true,
    },
  ],
};

export const HomePage: React.FC<HomePageProps> = ({ fullName, role, clinicName }) => {
  const getRoleLabel = (r?: UserRole): string => {
    switch (r) {
      case 'CLINICIAN':
        return 'Clinical Provider';
      case 'PATIENT':
        return 'Patient';
      case 'CLINIC_MANAGER':
        return 'Clinic Manager';
      case 'ADMIN':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const accessCards = role ? (ROLE_ACCESS[role] || ROLE_ACCESS.PATIENT) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 pt-20">
      {/* Hero Section */}
      <div className="border-b border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-transparent px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-4xl font-bold text-transparent">
                VitalsEdge
              </h1>
              <p className="text-sm text-blue-200">Remote Patient Monitoring Platform</p>
            </div>
          </div>

          <p className="mb-6 text-lg text-gray-300">
            Real-time vital sign monitoring and clinical decision support for better patient outcomes.
          </p>

          {/* Welcome Card */}
          <ThemeCard variant="hero" padding="lg" className="border-blue-500/30 bg-blue-500/10">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">
                Welcome, {fullName || 'User'}!
              </h2>
            </div>
            <p className="mb-4 text-gray-300">
              You're logged in as a{' '}
              <span className="font-semibold text-blue-300">{getRoleLabel(role)}</span>
              {clinicName && (
                <>
                  {' '}
                  at <span className="font-semibold text-cyan-300">{clinicName}</span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-400">
              Your access level determines which features and patient data you can view and manage.
            </p>
          </ThemeCard>
        </div>
      </div>

      {/* About Section */}
      <div className="border-b border-blue-500/20 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-3xl font-bold text-white">About VitalsEdge</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <ThemeCard variant="hero" padding="lg">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                <Heart className="h-5 w-5 text-red-400" />
                Real-time Monitoring
              </h3>
              <p className="text-gray-400">
                Continuous monitoring of vital signs with instant alerts for clinicians when critical thresholds are exceeded.
              </p>
            </ThemeCard>

            <ThemeCard variant="hero" padding="lg">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                <Lock className="h-5 w-5 text-blue-400" />
                HIPAA Compliant
              </h3>
              <p className="text-gray-400">
                Enterprise-grade security with full audit trails, encryption, and role-based access controls.
              </p>
            </ThemeCard>

            <ThemeCard variant="hero" padding="lg">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Clinical Insights
              </h3>
              <p className="text-gray-400">
                Analyze trends and patterns in patient data to make informed clinical decisions.
              </p>
            </ThemeCard>

            <ThemeCard variant="hero" padding="lg">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                <Users className="h-5 w-5 text-purple-400" />
                Care Coordination
              </h3>
              <p className="text-gray-400">
                Seamless collaboration between clinicians, patients, and clinic managers for optimal care delivery.
              </p>
            </ThemeCard>
          </div>
        </div>
      </div>

      {/* Access & Permissions Section */}
      <div className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-3xl font-bold text-white">Your Access & Permissions</h2>
          <p className="mb-8 text-gray-400">
            Based on your role as a <span className="font-semibold text-blue-300">{getRoleLabel(role)}</span>, you have access to the following features:
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accessCards.map((card, idx) => (
              <ThemeCard
                key={idx}
                variant="hero"
                padding="md"
                className={clsx(
                  'transition-all duration-200 hover:shadow-lg',
                  card.available
                    ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10'
                    : 'border-gray-500/20 bg-gray-500/5 opacity-60',
                )}
              >
                <div
                  className={clsx(
                    'mb-3 flex h-10 w-10 items-center justify-center rounded-lg',
                    card.available
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400'
                      : 'bg-gray-500/10 text-gray-400'
                  )}
                >
                  {card.icon}
                </div>
                <h3 className="mb-1 font-semibold text-white">{card.title}</h3>
                <p className="text-sm text-gray-400">{card.description}</p>
                {card.available && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Available
                  </div>
                )}
              </ThemeCard>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-blue-500/20 bg-gradient-to-t from-blue-500/10 to-transparent px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Ready to get started?</h2>
          <p className="mb-8 text-gray-400">
            Navigate to the Dashboard to access your role-specific features and manage your data.
          </p>
          <div className="flex items-center justify-center gap-4">
            <ThemeCard variant="hero" padding="sm" className="inline-block border-blue-500/30 bg-blue-500/10">
              <p className="text-sm text-gray-300">
                Use the Dashboard to view and manage your information
              </p>
            </ThemeCard>
          </div>
        </div>
      </div>
    </div>
  );
};
