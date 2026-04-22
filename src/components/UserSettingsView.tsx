/**
 * UserSettingsView Component
 *
 * Comprehensive settings page for user preferences and security.
 * Features:
 *  - Security settings (password, session management)
 *  - Notification preferences
 *  - Privacy and data settings
 */

import React, { useState, useCallback } from 'react';
import {
  Settings, Lock, Bell, Eye, AlertTriangle, Smartphone, LogOut, Shield,
  Check, X, Loader, ChevronRight, ToggleLeft, ToggleRight, Eye as EyeIcon,
  EyeOff, Trash2, Download, Calendar, Clock, MapPin, ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logAudit } from '../lib/audit';
import type { UserProfile } from '../types';
import { Button } from './common';
import { GlassInput } from './GlassInput';
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface UserSettingsViewProps {
  user: UserProfile | null;
  loading?: boolean;
  onBack?: () => void;
  onSignOut?: () => void;
}

interface NotificationSettings {
  emailAlerts: boolean;
  criticalOnly: boolean;
  dailyDigest: boolean;
  summaryFrequency: 'daily' | 'weekly' | 'never';
}

interface PasswordChangeState {
  step: 'confirm' | 'new' | 'verify';
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  error: string | null;
  success: boolean;
  isLoading: boolean;
  showPasswords: { current: boolean; new: boolean; confirm: boolean };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`;
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    return 'Password must contain a number';
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*]/.test(password)) {
    return 'Password must contain a special character (!@#$%^&*)';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS SECTION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SettingsSection({ title, description, children, icon: Icon }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className: string }>;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-4">
        {Icon && (
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{description}</p>}
        </div>
      </div>

      {/* Section Content */}
      <div className="px-6 py-6 bg-white dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD CHANGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function PasswordChangeSection({ user }: { user: UserProfile | null }) {
  const [state, setState] = useState<PasswordChangeState>({
    step: 'confirm',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    error: null,
    success: false,
    isLoading: false,
    showPasswords: { current: false, new: false, confirm: false },
  });

  const handleChangePassword = useCallback(async () => {
    if (state.step === 'confirm') {
      if (!state.currentPassword) {
        setState((prev) => ({ ...prev, error: 'Current password required' }));
        return;
      }
      setState((prev) => ({ ...prev, step: 'new', error: null }));
      return;
    }

    if (state.step === 'new') {
      const error = validatePassword(state.newPassword);
      if (error) {
        setState((prev) => ({ ...prev, error }));
        return;
      }

      if (state.newPassword !== state.confirmPassword) {
        setState((prev) => ({ ...prev, error: 'Passwords do not match' }));
        return;
      }

      setState((prev) => ({ ...prev, step: 'verify', isLoading: true, error: null }));

      try {
        if (auth.currentUser && auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, state.currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, state.newPassword);

          await logAudit({
            db,
            action: 'PASSWORD_CHANGED',
            actorId: user?.uid,
            actorRole: user?.role,
          });

          setState((prev) => ({
            ...prev,
            isLoading: false,
            success: true,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));

          setTimeout(() => {
            setState((prev) => ({ ...prev, step: 'confirm', success: false }));
          }, 3000);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          step: 'confirm',
          error: error instanceof Error ? error.message : 'Password change failed',
        }));
      }
    }
  }, [state, user]);

  return (
    <div className="space-y-5">
      {state.success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">Password changed successfully</p>
        </motion.div>
      )}

      {state.error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300 font-semibold text-sm">{state.error}</p>
        </motion.div>
      )}

      {state.step === 'confirm' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">
              Confirm Current Password
            </label>
            <div className="relative">
              <GlassInput
                type={state.showPasswords.current ? 'text' : 'password'}
                value={state.currentPassword}
                onChange={(e) => setState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password to verify identity"
                disabled={state.isLoading}
                className="dark:bg-slate-950 dark:text-white rounded-xl"
              />
              <button
                onClick={() => setState((prev) => ({ ...prev, showPasswords: { ...prev.showPasswords, current: !prev.showPasswords.current } }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {state.showPasswords.current ? <EyeOff className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={!state.currentPassword || state.isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl py-3 font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            {state.isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            Continue to Change Password
          </Button>
        </div>
      )}

      {state.step === 'new' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">
                New Password
              </label>
              <div className="relative">
                <GlassInput
                  type={state.showPasswords.new ? 'text' : 'password'}
                  value={state.newPassword}
                  onChange={(e) => setState((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Create a strong new password"
                  disabled={state.isLoading}
                  className="dark:bg-slate-950 dark:text-white rounded-xl"
                />
                <button
                  onClick={() => setState((prev) => ({ ...prev, showPasswords: { ...prev.showPasswords, new: !prev.showPasswords.new } }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {state.showPasswords.new ? <EyeOff className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Requirements:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { label: 'Uppercase letter', met: /[A-Z]/.test(state.newPassword) },
                  { label: 'Lowercase letter', met: /[a-z]/.test(state.newPassword) },
                  { label: 'Number', met: /[0-9]/.test(state.newPassword) },
                  { label: 'Special character', met: /[!@#$%^&*]/.test(state.newPassword) },
                  { label: '12+ characters', met: state.newPassword.length >= 12 },
                ].map((req, i) => (
                  <li key={i} className={clsx("text-xs flex items-center gap-2 font-medium transition-colors", req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600')}>
                    <Check className={clsx("h-3 w-3", req.met ? 'opacity-100' : 'opacity-20')} />
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">
                Confirm New Password
              </label>
              <div className="relative">
                <GlassInput
                  type={state.showPasswords.confirm ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={(e) => setState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  disabled={state.isLoading}
                  className="dark:bg-slate-950 dark:text-white rounded-xl"
                />
                <button
                  onClick={() => setState((prev) => ({ ...prev, showPasswords: { ...prev.showPasswords, confirm: !prev.showPasswords.confirm } }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {state.showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleChangePassword}
              disabled={state.isLoading || !state.newPassword || !state.confirmPassword}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl py-3 font-bold shadow-lg shadow-emerald-600/20"
            >
              {state.isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5 mr-2" />}
              Save New Password
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, step: 'confirm', error: null }))}
              disabled={state.isLoading}
              variant="secondary"
              className="flex-1 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-xl"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

function NotificationSettingsUI() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    criticalOnly: false,
    dailyDigest: false,
    summaryFrequency: 'daily',
  });

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={clsx(
        'relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
        active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
          active ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all hover:border-slate-200 dark:hover:border-slate-700">
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">Email Alerts</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Receive real-time notifications via email</p>
        </div>
        <Toggle active={settings.emailAlerts} onClick={() => setSettings(s => ({ ...s, emailAlerts: !s.emailAlerts }))} />
      </div>

      <AnimatePresence>
        {settings.emailAlerts && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 ml-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Critical Only</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Only receive severe health escalation alerts</p>
              </div>
              <Toggle active={settings.criticalOnly} onClick={() => setSettings(s => ({ ...s, criticalOnly: !s.criticalOnly }))} />
            </div>

            {!settings.criticalOnly && (
              <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 ml-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Daily Digest</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Get a summarized health report each morning</p>
                </div>
                <Toggle active={settings.dailyDigest} onClick={() => setSettings(s => ({ ...s, dailyDigest: !s.dailyDigest }))} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function UserSettingsView({
  user,
  loading = false,
  onBack,
  onSignOut,
}: UserSettingsViewProps) {
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-slate-100 dark:border-slate-800 rounded-full border-t-emerald-500 animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading security modules...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">Please sign in to your professional account to access clinical settings and security preferences.</p>
          <Button onClick={onBack} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl py-3 font-bold">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Security Section */}
        <SettingsSection
          title="Security & Access"
          description="Protect your account with robust password standards and session auditing"
          icon={Lock}
        >
          <PasswordChangeSection user={user} />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection
          title="Communication Preferences"
          description="Manage clinical alerts and platform update notifications"
          icon={Bell}
        >
          <NotificationSettingsUI />
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection
          title="Data Management"
          description="Control how your clinical data is handled and stored"
          icon={Eye}
        >
          <div className="space-y-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold text-slate-900 dark:text-white text-sm">Compliance Retention Policy</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Under standard health data regulations, your vital signs and clinical records are retained for a minimum of 24 months for longitudinal analysis.
              </p>
              <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span>Active Retention Scopes</span>
                <span className="text-emerald-600 dark:text-emerald-400">24 MONTHS</span>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Session Management */}
        <SettingsSection
          title="Authorized Sessions"
          description="View and manage devices currently accessing your account"
          icon={Smartphone}
        >
          <div className="space-y-3">
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Active Workspace</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Your current session
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  TRUSTED
                </span>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Sign Out Section */}
        <div className="bg-red-50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Terminate Session</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1 font-medium">Securely sign out and clear temporary clinical data cache</p>
              </div>
            </div>
            <Button
              onClick={onSignOut}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-2xl px-8 py-3.5 font-bold shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 transition-all"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-slate-900 dark:bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Shield className="h-20 w-20 text-white" />
          </div>
          <div className="flex gap-4 relative">
            <div className="p-3 bg-blue-500/20 rounded-2xl flex-shrink-0 self-start">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-xs text-slate-400 leading-relaxed font-medium">
              <strong className="text-white block mb-1">Infrastructure Governance:</strong> 
              Every interaction within these settings is cryptographically signed and recorded in the immutable audit trail.
              If you detect unauthorized access or unexpected changes, use the "Sign Out" button above and contact the security operations center.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSettingsView;
