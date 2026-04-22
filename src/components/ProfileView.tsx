/**
 * ProfileView
 *
 * Rendered when a user navigates to "My Profile" from the UserProfileMenu.
 * Shows:
 *  - Role-appropriate identity card
 *  - Data isolation scope (SPEC-compliant)
 *  - Editable display name + email (read-only)
 *  - For CLINICIANs: assigned patient count, specialty, license
 *  - For PATIENTs: own MRN, condition, assigned clinician
 *  - For ADMINs / CLINIC_MANAGERs: system access summary
 *  - Session info
 *
 * The component reads ONLY from `userData` (the current user's own record)
 * in full compliance with the User Specific Profile Data Isolation SPEC —
 * it never queries other users' documents.
 */

import React, { useState } from 'react';
import {
  User, Mail, Shield, Eye, Lock, Clock, Activity,
  Stethoscope, Heart, Building2, CheckCircle, Edit3, Save, X, ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GlassInput } from './GlassInput';
import type { UserRole } from './UserProfileMenu';

// ─── Prop types ───────────────────────────────────────────────────────────────

interface ProfileViewProps {
  userId: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  // Clinician-specific
  specialty?: string;
  licenseNumber?: string;
  assignedPatientCount?: number;
  clinicName?: string;
  // Patient-specific
  mrn?: string;
  condition?: string;
  assignedClinicianName?: string;
  // Common
  createdAt?: string;
  // Navigation
  onBack?: () => void;
}

// ─── Role display helpers ─────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  label: string;
  scopeTitle: string;
  scopeItems: string[];
}> = {
  ADMIN: {
    icon: <Shield className="h-5 w-5" />,
    color: 'violet',
    label: 'System Administrator',
    scopeTitle: 'System-wide access',
    scopeItems: [
      'Read and write all patient records',
      'Manage clinician accounts and permissions',
      'Access full audit trail and system logs',
      'Configure clinic-level thresholds',
    ],
  },
  CLINIC_MANAGER: {
    icon: <Building2 className="h-5 w-5" />,
    color: 'blue',
    label: 'Clinic Manager',
    scopeTitle: 'Clinic-scoped access',
    scopeItems: [
      'All patients within assigned clinic',
      'Clinician management for your clinic',
      'Clinic-level reporting and analytics',
      `No access to other clinics' data`,
    ],
  },
  CLINICIAN: {
    icon: <Stethoscope className="h-5 w-5" />,
    color: 'emerald',
    label: 'Clinician',
    scopeTitle: 'Patient-scoped access',
    scopeItems: [
      'Only patients assigned to your care',
      'Vital signs, alerts, and device config for assigned patients',
      'Your own profile and audit log entries',
      `No access to other clinicians' patients`,
    ],
  },
  PATIENT: {
    icon: <Heart className="h-5 w-5" />,
    color: 'cyan',
    label: 'Patient',
    scopeTitle: 'Self-scoped access',
    scopeItems: [
      'Your own vitals and health records only',
      `Your assigned clinician's contact info`,
      'Your own anomaly history and alerts',
      'No access to any other patient records',
    ],
  },
};

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string }> = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800/50',
    badge: 'bg-violet-100 dark:bg-violet-900/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/50',
    badge: 'bg-blue-100 dark:bg-blue-900/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/50',
    badge: 'bg-cyan-100 dark:bg-cyan-900/60',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
  },
};

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  fullName,
  email,
  role,
  specialty,
  licenseNumber,
  assignedPatientCount,
  clinicName,
  mrn,
  condition,
  assignedClinicianName,
  createdAt,
  onBack,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(fullName ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const cfg = (role && ROLE_CONFIG[role]) ?? ROLE_CONFIG.CLINICIAN;
  const col = colorMap[cfg.color] ?? colorMap.blue;

  const handleSaveName = async () => {
    if (!nameValue.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameSaving(true);
    setNameError(null);
    try {
      // Update Firebase Auth display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nameValue.trim() });
      }
      // Update Firestore user document (scoped to own record only)
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          fullName: nameValue.trim(),
          updatedAt: new Date().toISOString(),
        });
      }
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (err: any) {
      setNameError(err?.message ?? 'Failed to update name.');
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">My Profile</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Your identity, role, and data access scope within the VitalsEdge workspace.
          </p>
        </div>
      </div>

      {/* ── Identity card ── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
        {/* Role colour strip */}
        <div className={clsx('h-2', {
          'bg-violet-500': cfg.color === 'violet',
          'bg-blue-500': cfg.color === 'blue',
          'bg-emerald-500': cfg.color === 'emerald',
          'bg-cyan-500': cfg.color === 'cyan',
        })} />

        <div className="px-6 py-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className={clsx(
              'flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg',
              {
                'bg-violet-600': cfg.color === 'violet',
                'bg-blue-600': cfg.color === 'blue',
                'bg-emerald-600': cfg.color === 'emerald',
                'bg-cyan-600': cfg.color === 'cyan',
              },
            )}>
              {getInitials(fullName)}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-3 flex-wrap">
                {editingName ? (
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <GlassInput
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      className="text-lg font-semibold"
                      placeholder="Full name"
                      error={nameError ?? undefined}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={nameSaving}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {nameSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingName(false); setNameValue(fullName ?? ''); setNameError(null); }}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                      {fullName ?? 'Unknown user'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      aria-label="Edit name"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {nameSaved && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" /> Saved
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Email */}
              {email && (
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                  <span className="text-xs text-neutral-400 dark:text-neutral-600">(read-only — managed by IT)</span>
                </div>
              )}

              {/* Role badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide', col.badge, col.badgeText)}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                {clinicName && (
                  <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    <Building2 className="h-3.5 w-3.5" />
                    {clinicName}
                  </span>
                )}
              </div>

              {/* Account created */}
              {createdAt && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-600">
                  <Clock className="h-3.5 w-3.5" />
                  Member since {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role-specific detail ── */}
      {role === 'CLINICIAN' && (
        <div className="grid gap-5 sm:grid-cols-3">
          <ProfileStatCard
            label="Assigned Patients"
            value={assignedPatientCount !== undefined ? String(assignedPatientCount) : '—'}
            icon={<User className="h-4 w-4" />}
          />
          <ProfileStatCard
            label="Specialty"
            value={specialty ?? 'Not set'}
            icon={<Stethoscope className="h-4 w-4" />}
          />
          <ProfileStatCard
            label="License"
            value={licenseNumber ?? 'Not set'}
            icon={<Shield className="h-4 w-4" />}
          />
        </div>
      )}

      {role === 'PATIENT' && (
        <div className="grid gap-5 sm:grid-cols-3">
          <ProfileStatCard label="MRN" value={mrn ?? '—'} icon={<Activity className="h-4 w-4" />} />
          <ProfileStatCard label="Condition" value={condition ?? '—'} icon={<Heart className="h-4 w-4" />} />
          <ProfileStatCard label="Assigned Clinician" value={assignedClinicianName ?? '—'} icon={<Stethoscope className="h-4 w-4" />} />
        </div>
      )}

      {role === 'ADMIN' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileStatCard label="Access Level" value="Full system" icon={<Shield className="h-4 w-4" />} />
          <ProfileStatCard label="Audit Scope" value="All users + events" icon={<Eye className="h-4 w-4" />} />
        </div>
      )}

      {role === 'CLINIC_MANAGER' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileStatCard label="Clinic" value={clinicName ?? '—'} icon={<Building2 className="h-4 w-4" />} />
          <ProfileStatCard label="Oversight" value="Clinic-scoped" icon={<Eye className="h-4 w-4" />} />
        </div>
      )}

      {/* ── Data isolation scope ── */}
      <div className={clsx('rounded-2xl border p-5', col.bg, col.border)}>
        <div className="flex items-center gap-2 mb-3">
          {role === 'ADMIN' ? (
            <Shield className={clsx('h-4 w-4', col.text)} />
          ) : role === 'PATIENT' ? (
            <Lock className={clsx('h-4 w-4', col.text)} />
          ) : (
            <Eye className={clsx('h-4 w-4', col.text)} />
          )}
          <h3 className={clsx('text-xs font-bold uppercase tracking-widest', col.text)}>
            Your data access scope — {cfg.scopeTitle}
          </h3>
        </div>
        <ul className="space-y-2">
          {cfg.scopeItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <CheckCircle className={clsx('mt-0.5 h-4 w-4 shrink-0', col.text)} />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Access is enforced at the Firestore security rules layer. Attempts to read data outside your scope are blocked server-side and logged to the audit trail per the VitalsEdge Data Isolation SPEC.
        </p>
      </div>

      {/* ── Session info ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Current session</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SessionRow label="User ID" value={userId ? `${userId.slice(0, 12)}…` : '—'} />
          <SessionRow label="Auth provider" value={auth.currentUser?.providerData?.[0]?.providerId ?? 'password'} />
          <SessionRow label="Email verified" value={auth.currentUser?.emailVerified ? 'Yes' : 'No'} />
          <SessionRow label="Last sign-in" value={auth.currentUser?.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString() : '—'} />
        </div>
      </div>
    </section>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ProfileStatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
    <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 mb-2">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-base font-bold text-neutral-900 dark:text-white truncate">{value}</div>
  </div>
);

const SessionRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-b-0 last:pb-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">{label}</span>
    <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">{value}</span>
  </div>
);
