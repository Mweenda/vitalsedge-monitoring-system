/**
 * UserProfileMenu
 *
 * Renders a circular avatar (initials-based) in the top-right header.
 * On click → dropdown showing:
 *  - Identity card: name + role badge + data-access scope label
 *  - "My Profile" link (navigates to profile view)
 *  - "Settings" link (navigates to settings view)
 *  - Divider
 *  - Sign out with Firebase auth
 *
 * Role → label mapping respects the User Specific Profile Data Isolation SPEC:
 *   ADMIN          → full system access (all patients, all clinicians, audit logs)
 *   CLINIC_MANAGER → clinic-scoped access (all patients in assigned clinic)
 *   CLINICIAN      → patient-scoped access (only assigned patients)
 *   PATIENT        → self-scoped access (own vitals and records only)
 *
 * Usage:
 *   <UserProfileMenu
 *     fullName="Dr. Jane Smith"
 *     role="CLINICIAN"
 *     email="j.smith@hospital.org"
 *     onNavigate={(view) => setActiveTab(view)}
 *   />
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LogOut, User, Settings, ChevronDown, Shield, Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'ADMIN'
  | 'CLINIC_MANAGER'
  | 'CLINICIAN'
  | 'PATIENT'
  | string; // forward-compat

export type ProfileNavTarget = 'profile' | 'settings';

interface UserProfileMenuProps {
  fullName?: string;
  role?: UserRole;
  email?: string;
  /** Called when the user clicks a nav item inside the menu */
  onNavigate?: (target: ProfileNavTarget) => void;
  /** Called immediately before signOut fires — useful for clearing local state */
  onSignOut?: () => void;
}

// ─── Role metadata ────────────────────────────────────────────────────────────

interface RoleMeta {
  label: string;
  description: string;
  scopeLabel: string;
  scopeDetail: string;
  avatarColor: string; // Tailwind bg class
  badgeColor: string;  // Tailwind bg + text classes
}

const ROLE_META: Record<string, RoleMeta> = {
  ADMIN: {
    label: 'System Administrator',
    description: 'Full platform access',
    scopeLabel: 'System-wide',
    scopeDetail: 'All patients · All clinicians · Audit trail · System logs',
    avatarColor: 'bg-violet-600',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  },
  CLINIC_MANAGER: {
    label: 'Clinic Manager',
    description: 'Clinic-scoped oversight',
    scopeLabel: 'Clinic-scoped',
    scopeDetail: 'All patients in assigned clinic · Clinician management · Reports',
    avatarColor: 'bg-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  CLINICIAN: {
    label: 'Clinician',
    description: 'Assigned patients only',
    scopeLabel: 'Patient-scoped',
    scopeDetail: 'Assigned patients · Vitals · Alerts · Device config',
    avatarColor: 'bg-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  PATIENT: {
    label: 'Patient',
    description: 'Personal health records',
    scopeLabel: 'Self-scoped',
    scopeDetail: 'Own vitals and health records only',
    avatarColor: 'bg-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
  },
};

const FALLBACK_META: RoleMeta = {
  label: 'User',
  description: 'Limited access',
  scopeLabel: 'Standard',
  scopeDetail: 'View-only access to assigned resources',
  avatarColor: 'bg-neutral-500',
  badgeColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  fullName,
  role,
  email,
  onNavigate,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = (role && ROLE_META[role]) ?? FALLBACK_META;
  const initials = getInitials(fullName);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      onSignOut?.();
      await signOut(auth);
      // Firebase onAuthStateChanged in FirebaseProvider will handle redirect
    } catch (err: any) {
      setSignOutError(err?.message ?? 'Sign-out failed. Please try again.');
      setSigningOut(false);
    }
  }, [onSignOut]);

  const handleNavClick = (target: ProfileNavTarget) => {
    setOpen(false);
    onNavigate?.(target);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Open user menu"
        className="group flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md"
      >
        {/* Avatar circle */}
        <span
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white transition-transform group-hover:scale-105',
            meta.avatarColor,
          )}
        >
          {initials}
        </span>

        {/* Name + role — hidden on small screens */}
        <span className="hidden sm:flex flex-col items-start leading-none">
          <span className="max-w-[120px] truncate text-xs font-semibold text-neutral-900 dark:text-white">
            {fullName ?? 'My Account'}
          </span>
          <span className={clsx('mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', meta.badgeColor)}>
            {meta.label}
          </span>
        </span>

        <ChevronDown
          className={clsx(
            'h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={clsx(
              'absolute right-0 top-full z-[60] mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl',
              'border border-neutral-200 dark:border-neutral-700',
              'bg-white dark:bg-neutral-900',
              'shadow-2xl shadow-black/10 dark:shadow-black/50',
            )}
          >
            {/* ── Identity card ── */}
            <div className="px-5 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start gap-4">
                {/* Large avatar */}
                <span
                  className={clsx(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg',
                    meta.avatarColor,
                  )}
                >
                  {initials}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                    {fullName ?? 'Unknown user'}
                  </p>
                  {email && (
                    <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                      {email}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', meta.badgeColor)}>
                      {meta.label}
                    </span>
                    <span className="rounded-full border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {meta.description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data-access scope — enforces the isolation SPEC visually */}
              <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {role === 'ADMIN' ? (
                    <Shield className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  ) : role === 'PATIENT' ? (
                    <Lock className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Data access · {meta.scopeLabel}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {meta.scopeDetail}
                </p>
              </div>
            </div>

            {/* ── Nav items ── */}
            <div className="p-2">
              <MenuButton
                icon={<User className="h-4 w-4" />}
                label="My Profile"
                description="Personal details and preferences"
                onClick={() => handleNavClick('profile')}
              />
              <MenuButton
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                description="Notifications and display options"
                onClick={() => handleNavClick('settings')}
              />
            </div>

            {/* ── Sign out ── */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 p-2">
              {signOutError && (
                <p className="mb-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  {signOutError}
                </p>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-950/40',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </div>
                  <div className="text-[11px] text-red-400 dark:text-red-500">
                    End your session securely
                  </div>
                </div>
              </button>
            </div>

            {/* ── Footer: compliance notice ── */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 px-5 py-3">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 leading-relaxed">
                Session data is scoped to your role. Unauthorised access attempts are logged and audited per HIPAA § 164.312.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Internal menu button ─────────────────────────────────────────────────────

const MenuButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}> = ({ icon, label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
    )}
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
      {icon}
    </span>
    <div>
      <div className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</div>
      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  </button>
);
