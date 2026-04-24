import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  FirestoreError,
  DocumentReference,
  QueryConstraint,
} from 'firebase/firestore';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Clinician {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  hospitalId: string;
  department?: string;
  ward?: string;
  specialization: string;
  licenseNumber?: string;
  licenseIssuingBody?: string;
  yearsOfExperience?: number;
  qualifications?: string;
  servicesOffered: string[];
  consultationFee?: number;
  serviceHours?: string;
  biography?: string;
  profileImageUrl?: string;
  languages: string[];
  availabilityStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PART_TIME';
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  lastLogin?: Date;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    country?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  hospitalId: string;
  assignedClinicianId?: string;
  assignedBed?: string;
  assignedWard?: string;
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  vitalsThresholds: VitalThresholds;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED' | 'DECEASED';
  enrolledDate: Date;
  dischargedDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VitalThresholds {
  heartRate?: { min: number; max: number };
  bloodPressure?: { systolicMin: number; systolicMax: number; diastolicMin: number; diastolicMax: number };
  spO2?: { min: number; max: number };
  temperature?: { min: number; max: number };
  respiratoryRate?: { min: number; max: number };
  glucose?: { min: number; max: number };
}

export interface VitalReading {
  id?: string;
  patientId: string;
  deviceId: string;
  timestamp: Date;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  spO2?: number;
  temperature?: number;
  respiratoryRate?: number;
  glucose?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  anomalyDetected: boolean;
  anomalyType?: string[];
}

export interface DeviceConfig {
  id: string;
  name: string;
  type: 'ESP32' | 'STM32' | 'BLE_SENSOR' | 'OTHER';
  serialNumber?: string;
  macAddress?: string;
  firmwareVersion?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CALIBRATION';
  hospitalId: string;
  assignedPatientId?: string;
  lastSeen?: Date;
  batteryLevel?: number;
  signalStrength?: number;
  config: {
    samplingRate?: number;
    transmissionInterval?: number;
    alertThresholds?: VitalThresholds;
    calibrationData?: Record<string, number>;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AlertLog {
  id?: string;
  patientId: string;
  deviceId: string;
  vitalType: 'HEART_RATE' | 'BLOOD_PRESSURE' | 'SPO2' | 'TEMPERATURE' | 'RESPIRATORY_RATE' | 'GLUCOSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  value: number;
  threshold: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

export interface AuditLog {
  id?: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

class DatabaseService {
  private hospitalsRef = collection(db, 'hospitals');
  private cliniciansRef = collection(db, 'clinicians');
  private patientsRef = collection(db, 'patients');
  private vitalsRef = collection(db, 'vitals');
  private devicesRef = collection(db, 'devices');
  private alertsRef = collection(db, 'alerts');
  private auditRef = collection(db, 'audit_logs');

  async getHospital(id: string): Promise<Hospital | null> {
    const hospitalDoc = await getDoc(doc(this.hospitalsRef, id));
    return hospitalDoc.exists() ? { id: hospitalDoc.id, ...hospitalDoc.data() } as Hospital : null;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    const snapshot = await getDocs(this.hospitalsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  }

  async getActiveHospitals(): Promise<Hospital[]> {
    const q = query(this.hospitalsRef, where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  }

  async getClinician(uid: string): Promise<Clinician | null> {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) return null;
    
    const clinicianDoc = await getDoc(doc(this.cliniciansRef, uid));
    if (!clinicianDoc.exists()) return null;
    
    return {
      uid: clinicianDoc.id,
      ...clinicianDoc.data(),
      email: userDoc.data().email,
    } as Clinician;
  }

  async getCliniciansByHospital(hospitalId: string): Promise<Clinician[]> {
    const q = query(
      this.cliniciansRef,
      where('hospitalId', '==', hospitalId),
      where('status', '==', 'VERIFIED'),
      orderBy('lastName')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Clinician));
  }

  async getClinicianPatients(clinicianId: string): Promise<Patient[]> {
    const q = query(
      this.patientsRef,
      where('assignedClinicianId', '==', clinicianId),
      where('status', '==', 'ACTIVE'),
      orderBy('lastName')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  }

  async getPatient(id: string): Promise<Patient | null> {
    const patientDoc = await getDoc(doc(this.patientsRef, id));
    return patientDoc.exists() ? { id: patientDoc.id, ...patientDoc.data() } as Patient : null;
  }

  async getPatientByMRN(mrn: string): Promise<Patient | null> {
    const q = query(this.patientsRef, where('mrn', '==', mrn), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Patient;
  }

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(this.patientsRef);
    await setDoc(docRef, {
      ...patient,
      id: docRef.id,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
    await updateDoc(doc(this.patientsRef, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async getVitalReadings(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
    maxResults = 100
  ): Promise<VitalReading[]> {
    const constraints: QueryConstraint[] = [where('patientId', '==', patientId)];
    
    if (startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }
    
    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(maxResults));
    
    const q = query(this.vitalsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VitalReading));
  }

  subscribeToVitals(
    patientId: string,
    callback: (readings: VitalReading[]) => void,
    maxResults = 30
  ): () => void {
    const q = query(
      this.vitalsRef,
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const readings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VitalReading));
      callback(readings);
    });
    
    return unsubscribe;
  }

  async getDevicesByPatient(patientId: string): Promise<DeviceConfig[]> {
    const q = query(
      this.devicesRef,
      where('assignedPatientId', '==', patientId),
      where('status', '==', 'ACTIVE')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeviceConfig));
  }

  async getDevice(id: string): Promise<DeviceConfig | null> {
    const deviceDoc = await getDoc(doc(this.devicesRef, id));
    return deviceDoc.exists() ? { id: deviceDoc.id, ...deviceDoc.data() } as DeviceConfig : null;
  }

  async updateDeviceConfig(id: string, updates: Partial<DeviceConfig>): Promise<void> {
    await updateDoc(doc(this.devicesRef, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async getActiveAlerts(patientId?: string): Promise<AlertLog[]> {
    const constraints: QueryConstraint[] = [where('status', '==', 'ACTIVE')];
    
    if (patientId) {
      constraints.push(where('patientId', '==', patientId));
    }
    
    constraints.push(orderBy('triggeredAt', 'desc'));
    
    const q = query(this.alertsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertLog));
  }

  async acknowledgeAlert(alertId: string, clinicianId: string): Promise<void> {
    await updateDoc(doc(this.alertsRef, alertId), {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: Timestamp.now(),
      acknowledgedBy: clinicianId,
    });
  }

  async resolveAlert(alertId: string, notes?: string): Promise<void> {
    await updateDoc(doc(this.alertsRef, alertId), {
      status: 'RESOLVED',
      resolvedAt: Timestamp.now(),
      notes,
    });
  }

  subscribeToAlerts(
    patientId: string,
    callback: (alerts: AlertLog[]) => void
  ): () => void {
    const q = query(
      this.alertsRef,
      where('patientId', '==', patientId),
      where('status', '==', 'ACTIVE'),
      orderBy('triggeredAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertLog));
      callback(alerts);
    });
    
    return unsubscribe;
  }
}

export const dbService = new DatabaseService();
export default dbService;