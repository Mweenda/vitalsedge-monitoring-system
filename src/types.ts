export type UserRole = 'ADMIN' | 'CLINIC_MANAGER' | 'CLINICIAN' | 'PATIENT';

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  createdAt: string;
  degraded?: boolean;
  // Clinician-specific
  clinicId?: string;
  clinicName?: string;
  specialty?: string;
  licenseNumber?: string;
  // Patient-specific
  mrn?: string;
  condition?: string;
  assignedClinicianId?: string;
  assignedClinicianName?: string;
  deviceId?: string;
}

export interface VitalSigns {
  patientId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolicBP: number;
  diastolicBP: number;
  glucose: number;
  measuredAt: string;
}

export interface Anomaly {
  id?: string;
  patientId: string;
  type: 'tachycardia' | 'fever' | 'hypoxia' | 'hypertension' | 'hypotension' | 'glucose_abnormal';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  value: number;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface PatientData {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  age: number;
  condition: string;
  clinicId: string;
  status: 'active' | 'discharged' | 'transferred';
  deviceId: string;
  thresholds: {
    hr: { min: number; max: number };
    spo2: { min: number; max: number };
    temperature: { min: number; max: number };
    glucose: { min: number; max: number };
    systolicBP: { min: number; max: number };
    diastolicBP: { min: number; max: number };
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  status: 'success' | 'failure';
  timestamp: string;
  details?: any;
}

export interface DeviceSettings {
  thresholds: {
    heartRate: { min: number; max: number };
    spo2: { min: number };
    temperature: { max: number };
    bloodPressure: { systolicMax: number; diastolicMax: number };
    glucose: { min: number; max: number };
  };
}
