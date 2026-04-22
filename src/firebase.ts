import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User as FirebaseUser, connectAuthEmulator, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, onSnapshot, query, orderBy, limit, setDoc, addDoc, updateDoc, deleteDoc, getDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { logAudit } from './lib/audit';

// Firebase configuration from environment variables with fallbacks
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_API_KEY || 'AIzaSyBEVbXvj8i97mH4XhpoLjjiwWafK05h_uU',
  authDomain: (import.meta as any).env?.VITE_AUTH_DOMAIN || 'vitalsedge-monitoring-system.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_PROJECT_ID || 'vitalsedge-monitoring-system',
  storageBucket: (import.meta as any).env?.VITE_STORAGE_BUCKET || 'vitalsedge-monitoring-system.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_MESSAGING_SENDER_ID || '876588095418',
  appId: (import.meta as any).env?.VITE_APP_ID || '1:876588095418:web:025dba4289a7eba1346f83',
  measurementId: (import.meta as any).env?.VITE_MEASUREMENT_ID || 'G-TCCBF76B30'
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Set auth persistence to session to avoid offline issues
auth.setPersistence(browserSessionPersistence).catch((error) => {
  console.warn('Auth persistence setup failed:', error);
});

// Connect to emulators in development
let emulatorsConnected = false;
if ((import.meta as any).env?.DEV && window.location.hostname === 'localhost') {
  try {
    // Check if emulators are responding before connecting
    const checkEmulator = async (url: string, timeout = 2000): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { 
          method: 'OPTIONS',
          signal: controller.signal,
          mode: 'no-cors'
        });
        clearTimeout(timeoutId);
        return true;
      } catch (e) {
        return false;
      }
    };

    const authEmulatorReady = await checkEmulator('http://localhost:9099');
    const firestoreEmulatorReady = await checkEmulator('http://localhost:8080');

    if (authEmulatorReady && firestoreEmulatorReady) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      emulatorsConnected = true;
      console.log('🔥 Connected to Firebase emulators');
      console.log('📊 Auth Emulator: http://localhost:9099');
      console.log('🗄️ Firestore Emulator: http://localhost:8080');
      console.log('💾 Storage Emulator: http://localhost:9199');
      
      // Clear any existing auth state in development
      auth.signOut().catch(() => {
        // Ignore sign-out errors, user might not be signed in
      });
    } else {
      console.warn('⚠️ Firebase emulators not responding. Please run:');
      console.warn('   pnpm run dev:full');
      console.warn('   or in separate terminals:');
      console.warn('   Terminal 1: pnpm run emulators');
      console.warn('   Terminal 2: pnpm run dev:frontend');
      if (!authEmulatorReady) console.warn('   - Auth Emulator (9099) is not responding');
      if (!firestoreEmulatorReady) console.warn('   - Firestore Emulator (8080) is not responding');
    }
  } catch (error) {
    console.warn('⚠️ Error connecting to emulators:', error);
  }
}

// Export emulator connection status for use in components
export const getEmulatorStatus = () => emulatorsConnected;

function omitUndefinedFields<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// Helper function to create doctor profile
export const createDoctorProfile = async (doctorData: any) => {
  try {
    const doctorRef = doc(db, 'doctors', doctorData.uid);
    await setDoc(
      doctorRef,
      omitUndefinedFields({
        ...doctorData,
        createdAt: new Date(),
        status: 'PENDING_VERIFICATION',
        verifiedAt: null,
        verifiedBy: null,
        lastLogin: new Date(),
      }),
    );

    const fullName = `${doctorData.firstName} ${doctorData.lastName}`.trim();
    await setDoc(
      doc(db, 'users', doctorData.uid),
      {
        email: doctorData.email,
        fullName: fullName || doctorData.email,
        role: 'CLINICIAN',
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
    
    // Create audit log
    await createAuditLog({
      action: 'DOCTOR_REGISTRATION',
      doctorEmail: doctorData.email,
      doctorId: doctorData.uid,
      hospitalId: doctorData.hospitalId,
      details: { specialization: doctorData.specialization, services: doctorData.servicesOffered },
      status: 'SUCCESS'
    });
    
    return true;
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    throw error;
  }
};

// Helper function to create patient record
export const createPatientRecord = async (patientData: any) => {
  try {
    const patientRef = doc(db, 'patients', patientData.id);
    await setDoc(patientRef, {
      ...patientData,
      enrolledDate: new Date(),
      status: 'ACTIVE'
    });
    
    // Create audit log
    await createAuditLog({
      action: 'PATIENT_ENROLLED',
      doctorEmail: auth.currentUser?.email,
      doctorId: auth.currentUser?.uid,
      patientId: patientData.id,
      hospitalId: patientData.hospitalId,
      details: { condition: patientData.medicalConditions },
      status: 'SUCCESS'
    });
    
    return true;
  } catch (error) {
    console.error('Error creating patient record:', error);
    throw error;
  }
};

// Helper function to create audit log
export const createAuditLog = async (logData: any) => {
  try {
    await logAudit({
      db,
      action: logData.action ?? 'UNKNOWN_ACTION',
      actorId: logData.doctorId ?? logData.userId ?? auth.currentUser?.uid ?? null,
      actorRole: logData.actorRole ?? null,
      targetId:
        logData.targetId ??
        logData.resourceId ??
        logData.patientId ??
        logData.doctorId ??
        null,
      metadata: {
        ...logData,
        ipAddress: window.location.hostname,
        timestamp: undefined,
        action: undefined,
        actorRole: undefined,
        doctorId: undefined,
        userId: undefined,
        targetId: undefined,
        resourceId: undefined,
        patientId: undefined,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Initialize hospitals
export const initializeHospitals = async () => {
  const hospitals = [
    {
      id: 'maina_soko',
      name: 'Maina Soko Medical Centre',
      address: 'Lusaka, Zambia',
      phone: '+260-211-123456',
      email: 'info@mainasko.zm',
      status: 'ACTIVE'
    },
    {
      id: 'uth',
      name: 'University Teaching Hospital',
      address: 'Lusaka, Zambia', 
      phone: '+260-211-789012',
      email: 'info@uth.zm',
      status: 'ACTIVE'
    },
    {
      id: 'chilenje',
      name: 'Chilenje Level 1 Hospital',
      address: 'Lusaka, Zambia',
      phone: '+260-211-345678', 
      email: 'info@chilenje.zm',
      status: 'ACTIVE'
    }
  ];

  for (const hospital of hospitals) {
    try {
      const hospitalRef = doc(db, 'hospitals', hospital.id);
      const hospitalDoc = await getDoc(hospitalRef);
      if (!hospitalDoc.exists()) {
        // The browser should not be responsible for seeding shared reference data.
        // If rules prevent this write in production, continue without blocking signup.
        await setDoc(hospitalRef, {
          ...hospital,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.warn('Hospital initialization skipped:', error);
    }
  }
};

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Log to errors collection in background for production visibility
  if (isAuthenticated()) {
    addDoc(
      collection(db, 'system_errors'),
      omitUndefinedFields({
        ...errInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }),
    ).catch(logError => console.error('Failed to log error to Firestore:', logError));
  }

  throw new Error(JSON.stringify(errInfo));
}

function isAuthenticated() {
  return auth.currentUser != null;
}

// Validate Connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error) {
      if (error.message.includes('Missing or insufficient permissions') || error.message.includes('permission-denied')) {
        return;
      }
      if (error.message.includes('offline') || error.message.includes('unavailable')) {
        console.error('❌ Firestore connection failed. Make sure emulators are running.');
        console.error('   Run: pnpm run dev:full');
      } else {
        console.error('Firebase connection error:', error.message);
      }
    }
  }
}
testConnection();

export { onAuthStateChanged };
export type { FirebaseUser };

// Export Firebase instances for use throughout the app
export { auth, db, storage };
