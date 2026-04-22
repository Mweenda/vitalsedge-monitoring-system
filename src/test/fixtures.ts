/**
 * Test Fixtures
 * 
 * Centralized test data with clear clinician vs. patient distinction.
 * All test data derives from this file to ensure consistency across tests.
 * 
 * CLINICIANS: Medical professionals who manage patients
 * PATIENTS: End users receiving care and monitoring
 */

import type { UserProfile, PatientData, VitalSigns, Anomaly } from '../types';

// ───────────────────────────────────────────────────────────────────────────
// CLINICIAN FIXTURES
// ───────────────────────────────────────────────────────────────────────────

export const CLINICIAN_FIXTURES = {
  /** Christopher Kawanga - Senior Clinician */
  christopher: {
    uid: 'clinician-christopher-001',
    email: 'christopher.kawanga@hospital.local',
    fullName: 'Christopher Kawanga',
    role: 'CLINICIAN' as const,
    createdAt: '2024-01-15T10:00:00Z',
    clinicId: 'clinic-001',
    clinicName: 'Central Medical Hospital',
    specialty: 'Cardiology',
    licenseNumber: 'UG-CARD-2020-0891',
  } as UserProfile,

  /** Dr. Sarah Muwonge - Emergency Medicine */
  sarah: {
    uid: 'clinician-sarah-001',
    email: 'sarah.muwonge@hospital.local',
    fullName: 'Sarah Muwonge',
    role: 'CLINICIAN' as const,
    createdAt: '2024-02-01T14:30:00Z',
    clinicId: 'clinic-001',
    clinicName: 'Central Medical Hospital',
    specialty: 'Emergency Medicine',
    licenseNumber: 'UG-EM-2021-0453',
  } as UserProfile,

  /** Dr. James Okello - Internal Medicine */
  james: {
    uid: 'clinician-james-001',
    email: 'james.okello@hospital.local',
    fullName: 'James Okello',
    role: 'CLINICIAN' as const,
    createdAt: '2024-01-20T09:15:00Z',
    clinicId: 'clinic-002',
    clinicName: 'Riverside Medical Center',
    specialty: 'Internal Medicine',
    licenseNumber: 'UG-IM-2019-0128',
  } as UserProfile,
};

// ───────────────────────────────────────────────────────────────────────────
// PATIENT FIXTURES
// ───────────────────────────────────────────────────────────────────────────

export const PATIENT_FIXTURES = {
  /** Mweenda Lubi - Patient with CHF */
  mweenda: {
    uid: 'patient-mweenda-001',
    email: 'mweenda.lubi@gmail.com',
    fullName: 'Mweenda Lubi',
    role: 'PATIENT' as const,
    createdAt: '2024-03-10T08:00:00Z',
    mrn: 'MRN-2024-001891',
    condition: 'CHF',
    assignedClinicianId: CLINICIAN_FIXTURES.christopher.uid,
    assignedClinicianName: 'Christopher Kawanga',
    deviceId: 'device-001',
  } as UserProfile,

  /** Samuel Mwaura - Patient with Hypertension */
  samuel: {
    uid: 'patient-samuel-001',
    email: 'samuel.mwaura@gmail.com',
    fullName: 'Samuel Mwaura',
    role: 'PATIENT' as const,
    createdAt: '2024-03-12T10:30:00Z',
    mrn: 'MRN-2024-001892',
    condition: 'HTN',
    assignedClinicianId: CLINICIAN_FIXTURES.christopher.uid,
    assignedClinicianName: 'Christopher Kawanga',
    deviceId: 'device-002',
  } as UserProfile,

  /** Grace Kipchoge - Patient with Diabetes */
  grace: {
    uid: 'patient-grace-001',
    email: 'grace.kipchoge@gmail.com',
    fullName: 'Grace Kipchoge',
    role: 'PATIENT' as const,
    createdAt: '2024-03-15T13:45:00Z',
    mrn: 'MRN-2024-001893',
    condition: 'DM2',
    assignedClinicianId: CLINICIAN_FIXTURES.sarah.uid,
    assignedClinicianName: 'Sarah Muwonge',
    deviceId: 'device-003',
  } as UserProfile,

  /** Elizabeth Omondi - Patient with COPD */
  elizabeth: {
    uid: 'patient-elizabeth-001',
    email: 'elizabeth.omondi@gmail.com',
    fullName: 'Elizabeth Omondi',
    role: 'PATIENT' as const,
    createdAt: '2024-03-18T11:20:00Z',
    mrn: 'MRN-2024-001894',
    condition: 'COPD',
    assignedClinicianId: CLINICIAN_FIXTURES.james.uid,
    assignedClinicianName: 'James Okello',
    deviceId: 'device-004',
  } as UserProfile,
};

// ───────────────────────────────────────────────────────────────────────────
// PATIENT DATA FIXTURES
// ───────────────────────────────────────────────────────────────────────────

export const PATIENT_DATA_FIXTURES: Record<string, PatientData> = {
  mweenda: {
    id: PATIENT_FIXTURES.mweenda.uid,
    mrn: PATIENT_FIXTURES.mweenda.mrn!,
    firstName: 'Mweenda',
    lastName: 'Lubi',
    dateOfBirth: '1965-05-10',
    email: PATIENT_FIXTURES.mweenda.email!,
    phone: '+256701234567',
    age: 59,
    condition: 'CHF',
    clinicId: 'clinic-001',
    status: 'active',
    deviceId: 'device-001',
    thresholds: {
      hr: { min: 60, max: 100 },
      spo2: { min: 94, max: 100 },
      temperature: { min: 36.5, max: 37.5 },
      glucose: { min: 90, max: 150 },
      systolicBP: { min: 110, max: 140 },
      diastolicBP: { min: 70, max: 90 },
    },
    emergencyContact: {
      name: 'James Lubi',
      relationship: 'Son',
      phone: '+256701234560',
    },
    createdAt: PATIENT_FIXTURES.mweenda.createdAt,
    updatedAt: new Date().toISOString(),
  },

  samuel: {
    id: PATIENT_FIXTURES.samuel.uid,
    mrn: PATIENT_FIXTURES.samuel.mrn!,
    firstName: 'Samuel',
    lastName: 'Mwaura',
    dateOfBirth: '1972-08-22',
    email: PATIENT_FIXTURES.samuel.email!,
    phone: '+256702234567',
    age: 51,
    condition: 'HTN',
    clinicId: 'clinic-001',
    status: 'active',
    deviceId: 'device-002',
    thresholds: {
      hr: { min: 55, max: 95 },
      spo2: { min: 95, max: 100 },
      temperature: { min: 36.5, max: 37.5 },
      glucose: { min: 85, max: 180 },
      systolicBP: { min: 120, max: 160 },
      diastolicBP: { min: 75, max: 100 },
    },
    emergencyContact: {
      name: 'Patricia Mwaura',
      relationship: 'Spouse',
      phone: '+256702234560',
    },
    createdAt: PATIENT_FIXTURES.samuel.createdAt,
    updatedAt: new Date().toISOString(),
  },

  grace: {
    id: PATIENT_FIXTURES.grace.uid,
    mrn: PATIENT_FIXTURES.grace.mrn!,
    firstName: 'Grace',
    lastName: 'Kipchoge',
    dateOfBirth: '1980-03-15',
    email: PATIENT_FIXTURES.grace.email!,
    phone: '+256703234567',
    age: 44,
    condition: 'DM2',
    clinicId: 'clinic-001',
    status: 'active',
    deviceId: 'device-003',
    thresholds: {
      hr: { min: 60, max: 100 },
      spo2: { min: 95, max: 100 },
      temperature: { min: 36.5, max: 37.5 },
      glucose: { min: 120, max: 200 },
      systolicBP: { min: 110, max: 140 },
      diastolicBP: { min: 70, max: 90 },
    },
    emergencyContact: {
      name: 'David Kipchoge',
      relationship: 'Brother',
      phone: '+256703234560',
    },
    createdAt: PATIENT_FIXTURES.grace.createdAt,
    updatedAt: new Date().toISOString(),
  },
};

// ───────────────────────────────────────────────────────────────────────────
// VITAL SIGNS FIXTURES
// ───────────────────────────────────────────────────────────────────────────

export const VITAL_SIGNS_FIXTURES: Record<string, VitalSigns[]> = {
  mweenda_chf: [
    {
      patientId: PATIENT_FIXTURES.mweenda.uid,
      heartRate: 88,
      spo2: 97,
      temperature: 37.1,
      systolicBP: 132,
      diastolicBP: 82,
      glucose: 115,
      measuredAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      patientId: PATIENT_FIXTURES.mweenda.uid,
      heartRate: 92,
      spo2: 96,
      temperature: 37.2,
      systolicBP: 135,
      diastolicBP: 84,
      glucose: 118,
      measuredAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],

  samuel_htn: [
    {
      patientId: PATIENT_FIXTURES.samuel.uid,
      heartRate: 78,
      spo2: 98,
      temperature: 36.8,
      systolicBP: 148,
      diastolicBP: 92,
      glucose: 105,
      measuredAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],

  grace_dm2: [
    {
      patientId: PATIENT_FIXTURES.grace.uid,
      heartRate: 72,
      spo2: 98,
      temperature: 36.9,
      systolicBP: 128,
      diastolicBP: 80,
      glucose: 165,
      measuredAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// ANOMALY FIXTURES
// ───────────────────────────────────────────────────────────────────────────

export const ANOMALY_FIXTURES: Record<string, Anomaly> = {
  mweenda_tachycardia: {
    id: 'anomaly-001',
    patientId: PATIENT_FIXTURES.mweenda.uid,
    type: 'tachycardia',
    severity: 'medium',
    message: 'Heart rate elevated above threshold',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    value: 105,
    acknowledged: false,
  },

  samuel_hypertension: {
    id: 'anomaly-002',
    patientId: PATIENT_FIXTURES.samuel.uid,
    type: 'hypertension',
    severity: 'high',
    message: 'Systolic BP critically elevated',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    value: 165,
    acknowledged: false,
  },

  grace_glucose_high: {
    id: 'anomaly-003',
    patientId: PATIENT_FIXTURES.grace.uid,
    type: 'glucose_abnormal',
    severity: 'low',
    message: 'Blood glucose above target range',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    value: 210,
    acknowledged: true,
    acknowledgedBy: CLINICIAN_FIXTURES.sarah.uid,
    acknowledgedAt: new Date(Date.now() - 300000).toISOString(),
  },
};

// ───────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Check if a user profile is a clinician
 */
export function isClinician(user: UserProfile): boolean {
  return user.role === 'CLINICIAN';
}

/**
 * Check if a user profile is a patient
 */
export function isPatient(user: UserProfile): boolean {
  return user.role === 'PATIENT';
}

/**
 * Get all clinicians from fixtures
 */
export function getAllClinicians(): UserProfile[] {
  return Object.values(CLINICIAN_FIXTURES);
}

/**
 * Get all patients from fixtures
 */
export function getAllPatients(): UserProfile[] {
  return Object.values(PATIENT_FIXTURES);
}

/**
 * Get patients assigned to a specific clinician
 */
export function getPatientsForClinician(clinicianUid: string): UserProfile[] {
  return Object.values(PATIENT_FIXTURES).filter(
    (patient) => patient.assignedClinicianId === clinicianUid
  );
}

/**
 * Get a random clinician fixture
 */
export function getRandomClinician(): UserProfile {
  const clinicians = getAllClinicians();
  return clinicians[Math.floor(Math.random() * clinicians.length)];
}

/**
 * Get a random patient fixture
 */
export function getRandomPatient(): UserProfile {
  const patients = getAllPatients();
  return patients[Math.floor(Math.random() * patients.length)];
}
