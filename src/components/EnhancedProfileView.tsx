/**
 * EnhancedProfileView Component
 *
 * Comprehensive profile page for both clinicians and patients.
 * Features:
 *  - Role-appropriate profile display
 *  - Inline editing with validation
 *  - Professional data presentation
 *  - Accessibility support
 *  - HIPAA compliance notices
 */

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, Edit3, Save, X, Check, AlertCircle, Loader,
  User, Mail, Shield, Building2, FileText, Phone, Calendar,
  Stethoscope, Heart, Lock, Eye, CheckCircle2, AlertTriangle, Cpu,
  Sun, Moon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logAudit } from '../lib/audit';
import type { UserProfile } from '../types';
import { GlassInput } from './GlassInput';
import { Button } from './common';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface EnhancedProfileViewProps {
  user: UserProfile | null;
  loading?: boolean;
  onBack?: () => void;
  onProfileUpdated?: (user: UserProfile) => void;
}

interface EditState {
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
}

interface FormData {
  fullName: string;
  phone?: string;
}

interface FieldError {
  field: keyof FormData;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const EDIT_TIMEOUT = 3000; // ms

const VALIDATION_RULES: Record<keyof FormData, (value: any) => string | null> = {
  fullName: (value) => {
    if (!value || value.trim().length === 0) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 100) return 'Name must be less than 100 characters';
    return null;
  },
  phone: (value) => {
    if (!value) return null; // Optional
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLINICIAN PROFILE CARD
// ─────────────────────────────────────────────────────────────────────────────

function ClinicianProfileCard({ user }: { user: UserProfile }) {
  return (
    <div className="space-y-4">
      {/* Specialty & License */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Specialty</span>
          </div>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{user.specialty || 'Not specified'}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">License #</span>
          </div>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{user.licenseNumber || 'Not on file'}</p>
        </div>
      </div>

      {/* Clinic Assignment */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clinic Assignment</span>
        </div>
        <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{user.clinicName || 'Not assigned'}</p>
      </div>

      {/* Data Access Scope */}
      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex-shrink-0">
            <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data Access Scope</span>
            <p className="text-sm text-emerald-800 dark:text-emerald-300/90 mt-2 leading-relaxed">
              You have access to vital signs, alerts, and device configurations for your <strong>assigned patients only</strong>.
              Other clinicians' patients are not visible to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PROFILE CARD
// ─────────────────────────────────────────────────────────────────────────────

function PatientProfileCard({ user }: { user: UserProfile }) {
  return (
    <div className="space-y-4">
      {/* Medical Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 rounded-xl p-5 border border-pink-200 dark:border-pink-800/50 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">MRN</span>
          </div>
          <p className="text-xl font-bold text-pink-800 dark:text-pink-300">{user.mrn || 'Not on file'}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Heart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Condition</span>
          </div>
          <p className="text-xl font-bold text-amber-800 dark:text-amber-300">{user.condition || 'Not specified'}</p>
        </div>
      </div>

      {/* Assigned Clinician */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Clinician</span>
        </div>
        <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{user.assignedClinicianName || 'Not assigned'}</p>
      </div>

      {/* Device Assignment */}
      {user.deviceId && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 rounded-xl p-5 border border-purple-200 dark:border-purple-800/50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Cpu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monitoring Device</span>
          </div>
          <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{user.deviceId}</p>
        </div>
      )}

      {/* Data Access Scope */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">What You Can See</span>
            <ul className="text-sm text-blue-800 dark:text-blue-300/90 mt-3 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Your own vital signs and health data</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Alerts and recommendations from your clinician</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Your assigned clinician's contact information</span>
              </li>
              <li className="flex items-center gap-2 opacity-60">
                <X className="h-4 w-4 text-red-400" />
                <span>Other patients' data (not visible)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE NAME FIELD
// ─────────────────────────────────────────────────────────────────────────────

function EditableNameField({
  initialValue,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isSaving,
  error,
}: {
  initialValue: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  isSaving: boolean;
  error?: string;
}) {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue, isEditing]);

  const handleSave = () => {
    onSave(value);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <GlassInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your full name"
          disabled={isSaving}
          aria-label="Edit full name"
          className={clsx(
            "text-lg font-semibold dark:bg-slate-900/50 dark:text-white",
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
          )}
        />
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 px-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
          <Button
            onClick={onCancel}
            disabled={isSaving}
            variant="secondary"
            className="flex items-center gap-2 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{initialValue}</h2>
      <button
        onClick={onStartEdit}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        aria-label="Edit full name"
      >
        <Edit3 className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function EnhancedProfileView({
  user,
  loading = false,
  onBack,
  onProfileUpdated,
}: EnhancedProfileViewProps) {
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    isDirty: false,
    isSaving: false,
    error: null,
    success: false,
  });

  const [formData] = useState<FormData>({
    fullName: user?.fullName || '',
    phone: user?.email || '', 
  });

  // Handle save
  const handleSave = useCallback(async (newName: string) => {
    setEditState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const nameError = VALIDATION_RULES.fullName(newName);
      if (nameError) {
        setEditState((prev) => ({
          ...prev,
          isSaving: false,
          error: nameError,
        }));
        return;
      }

      // Update Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName });
      }

      // Update Firestore
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          fullName: newName,
          updatedAt: new Date().toISOString(),
        });

        // Log audit
        await logAudit({
          db,
          action: 'UPDATE_PROFILE',
          actorId: user.uid,
          actorRole: user.role,
          metadata: { field: 'fullName' },
        });
      }

      setEditState((prev) => ({
        ...prev,
        isEditing: false,
        isSaving: false,
        success: true,
        isDirty: false,
      }));

      // Clear success message after timeout
      setTimeout(() => {
        setEditState((prev) => ({ ...prev, success: false }));
      }, EDIT_TIMEOUT);

      if (onProfileUpdated && user) {
        onProfileUpdated({ ...user, fullName: newName });
      }
    } catch (error) {
      setEditState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      }));
    }
  }, [user, onProfileUpdated]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Securely loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">We couldn't retrieve your profile information. This may happen if your session has expired.</p>
          <Button onClick={onBack} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const roleConfig = {
    CLINICIAN: { bg: 'bg-emerald-50/50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-300' },
    PATIENT: { bg: 'bg-blue-50/50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-300' },
    ADMIN: { bg: 'bg-purple-50/50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-300' },
    CLINIC_MANAGER: { bg: 'bg-indigo-50/50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800/50', text: 'text-indigo-700 dark:text-indigo-300' },
  };

  const config = roleConfig[user.role] || roleConfig.CLINICIAN;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex items-center justify-between">
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Profile Overview</h1>
            </div>
            <div className={twMerge('px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm', config.bg, config.border, config.text)}>
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {editState.success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3 shadow-sm"
          >
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">Profile updated successfully</p>
          </motion.div>
        )}

        {/* Identity Card */}
        <div className={twMerge('rounded-3xl border p-8 mb-10 shadow-lg relative overflow-hidden', config.bg, config.border)}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-black/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
          
          <div className="relative">
            <div className="mb-6">
              <EditableNameField
                initialValue={user.fullName}
                isEditing={editState.isEditing}
                onStartEdit={() => setEditState((prev) => ({ ...prev, isEditing: true }))}
                onSave={handleSave}
                onCancel={() => {
                  setEditState((prev) => ({ ...prev, isEditing: false, error: null }));
                }}
                isSaving={editState.isSaving}
                error={editState.error}
              />
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6">
              {/* Email - Read Only */}
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-xl border border-white/50 dark:border-black/10">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">{user.email}</span>
                <Lock className="h-3.5 w-3.5 opacity-50 ml-1" />
              </div>

              {/* Account Created */}
              {user.createdAt && (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 px-4 py-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role-Specific Content */}
        <div className="space-y-10">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-3">
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
              {user.role === 'CLINICIAN' ? 'Professional Details' : 'Health Summary'}
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
            </h2>
            {user.role === 'CLINICIAN' ? (
              <ClinicianProfileCard user={user} />
            ) : user.role === 'PATIENT' ? (
              <PatientProfileCard user={user} />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                <Shield className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Administrative profile data is managed via the central registry.</p>
              </div>
            )}
          </div>
        </div>

        {/* HIPAA Compliance */}
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-900 dark:bg-slate-900/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Shield className="h-24 w-24 text-white" />
            </div>
            <div className="flex gap-4 relative">
              <div className="p-3 bg-blue-500/20 rounded-2xl flex-shrink-0 self-start">
                <Lock className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Security & Privacy Notice</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  <strong>HIPAA Compliance:</strong> Your health information and professional data are protected under Section 164.312 of the HIPAA Security Rule. 
                  Data is encrypted at rest and in transit. All profile modifications are logged for security auditing purposes.
                </p>
                <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> SOC2 Type II</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> AES-256 Encryption</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedProfileView;
