/**
 * Role Enforcement Utilities
 * 
 * Ensures strict separation between clinician and patient roles.
 * Used across all authentication and authorization checks.
 */

import type { UserProfile, UserRole } from '../types';

// ───────────────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS
// ───────────────────────────────────────────────────────────────────────────

export const ROLE_DEFINITIONS: Record<UserRole, { label: string; description: string }> = {
  ADMIN: {
    label: 'Administrator',
    description: 'Full system access. Manages users, clinicians, and system settings.',
  },
  CLINIC_MANAGER: {
    label: 'Clinic Manager',
    description: 'Manages clinic operations, staff, and patient assignments.',
  },
  CLINICIAN: {
    label: 'Clinician',
    description: 'Medical professional. Monitors assigned patients, updates thresholds, receives alerts.',
  },
  PATIENT: {
    label: 'Patient',
    description: 'End user receiving care. Views own vital signs and alerts.',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// ROLE CHECKING
// ───────────────────────────────────────────────────────────────────────────

/**
 * Verify user is a clinician
 * Throws error if user is not a CLINICIAN
 */
export function requireClinician(user: UserProfile | null): asserts user is UserProfile {
  if (!user || user.role !== 'CLINICIAN') {
    throw new Error('This action requires CLINICIAN role');
  }
}

/**
 * Verify user is a patient
 * Throws error if user is not a PATIENT
 */
export function requirePatient(user: UserProfile | null): asserts user is UserProfile {
  if (!user || user.role !== 'PATIENT') {
    throw new Error('This action requires PATIENT role');
  }
}

/**
 * Verify user is admin or clinic manager
 */
export function requireAdmin(user: UserProfile | null): asserts user is UserProfile {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CLINIC_MANAGER')) {
    throw new Error('This action requires ADMIN or CLINIC_MANAGER role');
  }
}

/**
 * Check if user has given role
 */
export function hasRole(user: UserProfile | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of given roles
 */
export function hasAnyRole(user: UserProfile | null, roles: UserRole[]): boolean {
  return user != null && roles.includes(user.role);
}

// ───────────────────────────────────────────────────────────────────────────
// CLINICIAN-SPECIFIC CHECKS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Verify clinician fields are complete
 */
export function validateClinicianProfile(user: UserProfile | null): boolean {
  if (!user || user.role !== 'CLINICIAN') {
    return false;
  }

  return !!(
    user.clinicId &&
    user.clinicName &&
    user.specialty &&
    user.licenseNumber &&
    user.email &&
    user.uid
  );
}

/**
 * Check if clinician can access patient
 * (Patient must be assigned to this clinician)
 */
export function canClinicianAccessPatient(
  clinician: UserProfile,
  patient: UserProfile
): boolean {
  if (!hasRole(clinician, 'CLINICIAN') || !hasRole(patient, 'PATIENT')) {
    return false;
  }

  // Patient must be assigned to this clinician
  return patient.assignedClinicianId === clinician.uid;
}

// ───────────────────────────────────────────────────────────────────────────
// PATIENT-SPECIFIC CHECKS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Verify patient fields are complete
 */
export function validatePatientProfile(user: UserProfile | null): boolean {
  if (!user || user.role !== 'PATIENT') {
    return false;
  }

  return !!(
    user.mrn &&
    user.condition &&
    user.assignedClinicianId &&
    user.assignedClinicianName &&
    user.deviceId &&
    user.email &&
    user.uid
  );
}

/**
 * Check if patient can access clinician's data
 * (Only their assigned clinician)
 */
export function canPatientAccessClinician(
  patient: UserProfile,
  clinician: UserProfile
): boolean {
  if (!hasRole(patient, 'PATIENT') || !hasRole(clinician, 'CLINICIAN')) {
    return false;
  }

  // Can only access assigned clinician
  return patient.assignedClinicianId === clinician.uid;
}

// ───────────────────────────────────────────────────────────────────────────
// ACCESS CONTROL
// ───────────────────────────────────────────────────────────────────────────

export interface AccessControlPolicy {
  canViewPatientList: boolean;
  canViewPatientDetail: (patient: UserProfile) => boolean;
  canEditPatientThresholds: (patient: UserProfile) => boolean;
  canViewOwnProfile: boolean;
  canEditOwnProfile: boolean;
  canViewClinicians: boolean;
  canManageClinicians: boolean;
  canManageAlerts: (patient: UserProfile) => boolean;
}

/**
 * Get access control policy for a user
 */
export function getAccessPolicy(user: UserProfile | null): AccessControlPolicy {
  if (!user) {
    return {
      canViewPatientList: false,
      canViewPatientDetail: () => false,
      canEditPatientThresholds: () => false,
      canViewOwnProfile: false,
      canEditOwnProfile: false,
      canViewClinicians: false,
      canManageClinicians: false,
      canManageAlerts: () => false,
    };
  }

  const role = user.role;

  switch (role) {
    case 'CLINICIAN':
      return {
        canViewPatientList: true,
        canViewPatientDetail: (patient) => canClinicianAccessPatient(user, patient),
        canEditPatientThresholds: (patient) => canClinicianAccessPatient(user, patient),
        canViewOwnProfile: true,
        canEditOwnProfile: true,
        canViewClinicians: false,
        canManageClinicians: false,
        canManageAlerts: (patient) => canClinicianAccessPatient(user, patient),
      };

    case 'PATIENT':
      return {
        canViewPatientList: false, // Patients don't see other patients
        canViewPatientDetail: (patient) => patient.uid === user.uid,
        canEditPatientThresholds: () => false, // Patients can't edit thresholds
        canViewOwnProfile: true,
        canEditOwnProfile: true, // Can edit own profile (name, contact)
        canViewClinicians: true, // Can view their assigned clinician
        canManageClinicians: false, // Can't manage clinicians
        canManageAlerts: (patient) => patient.uid === user.uid,
      };

    case 'CLINIC_MANAGER':
      return {
        canViewPatientList: true,
        canViewPatientDetail: () => true,
        canEditPatientThresholds: () => true,
        canViewOwnProfile: true,
        canEditOwnProfile: true,
        canViewClinicians: true,
        canManageClinicians: true,
        canManageAlerts: () => true,
      };

    case 'ADMIN':
      return {
        canViewPatientList: true,
        canViewPatientDetail: () => true,
        canEditPatientThresholds: () => true,
        canViewOwnProfile: true,
        canEditOwnProfile: true,
        canViewClinicians: true,
        canManageClinicians: true,
        canManageAlerts: () => true,
      };

    default:
      return {
        canViewPatientList: false,
        canViewPatientDetail: () => false,
        canEditPatientThresholds: () => false,
        canViewOwnProfile: false,
        canEditOwnProfile: false,
        canViewClinicians: false,
        canManageClinicians: false,
        canManageAlerts: () => false,
      };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PROFILE COMPLETION CHECKS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Check if user profile is complete and ready for use
 */
export function isProfileComplete(user: UserProfile | null): boolean {
  if (!user) return false;

  // Common fields all roles need
  if (!user.uid || !user.email || !user.fullName || !user.createdAt) {
    return false;
  }

  // Role-specific validation
  switch (user.role) {
    case 'CLINICIAN':
      return validateClinicianProfile(user);
    case 'PATIENT':
      return validatePatientProfile(user);
    case 'ADMIN':
    case 'CLINIC_MANAGER':
      return true; // Basic fields sufficient
    default:
      return false;
  }
}

/**
 * Get list of missing required fields for profile
 */
export function getMissingProfileFields(user: UserProfile | null): string[] {
  if (!user) return ['uid', 'email', 'fullName', 'createdAt', 'role'];

  const missing: string[] = [];

  // Common fields
  if (!user.uid) missing.push('uid');
  if (!user.email) missing.push('email');
  if (!user.fullName) missing.push('fullName');
  if (!user.createdAt) missing.push('createdAt');

  // Role-specific
  if (user.role === 'CLINICIAN') {
    if (!user.clinicId) missing.push('clinicId');
    if (!user.clinicName) missing.push('clinicName');
    if (!user.specialty) missing.push('specialty');
    if (!user.licenseNumber) missing.push('licenseNumber');
  }

  if (user.role === 'PATIENT') {
    if (!user.mrn) missing.push('mrn');
    if (!user.condition) missing.push('condition');
    if (!user.assignedClinicianId) missing.push('assignedClinicianId');
    if (!user.assignedClinicianName) missing.push('assignedClinicianName');
    if (!user.deviceId) missing.push('deviceId');
  }

  return missing;
}
