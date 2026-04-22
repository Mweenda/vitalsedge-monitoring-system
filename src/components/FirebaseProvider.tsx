import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, FirebaseUser } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';

function parseAdminEmails(): Set<string> {
  const raw = (import.meta as any).env?.VITE_ADMIN_EMAILS as string | undefined;
  const admins = new Set<string>();
  
  if (raw?.trim()) {
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((email) => admins.add(email));
  }
  return admins;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  userData: UserProfile | null;
  loading: boolean;
  degraded: boolean;
  error: string | null;
}

type AuthState = FirebaseContextType;

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  userData: null,
  loading: true,
  degraded: false,
  error: null,
});

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]);
}

function buildDefaultProfile(
  user: FirebaseUser,
  adminEmails: Set<string>,
  existing?: Record<string, unknown> | null,
  doctor?: Record<string, unknown> | null,
): UserProfile {
  const emailLower = user.email?.toLowerCase() ?? '';
  const fullNameFromDoctor = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim()
    : '';

  return {
    ...(existing ?? {}),
    uid: user.uid,
    email: user.email,
    fullName:
      fullNameFromDoctor ||
      (existing?.fullName as string) ||
      user.displayName ||
      'Clinician',
    role: (adminEmails.has(emailLower)
      ? 'ADMIN'
      : ((existing?.role as UserRole) || 'CLINICIAN')) as UserRole,
    createdAt: (existing?.createdAt as string) ?? new Date().toISOString(),
  } as UserProfile;
}

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  bootstrapTimeoutMs?: number;
}> = ({ children, bootstrapTimeoutMs = 5000 }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    degraded: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const adminEmails = parseAdminEmails();
      let degraded = false;
      let error: string | null = null;
      let userData: UserProfile | null = null;

      try {
        if (!firebaseUser) {
          setState({
            user: null,
            userData: null,
            loading: false,
            degraded: false,
            error: null,
          });
          return;
        }

        const hydrateUser = async () => {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const doctorDocRef = doc(db, 'doctors', firebaseUser.uid);
          const [userDoc, doctorDoc] = await Promise.all([
            getDoc(userDocRef),
            getDoc(doctorDocRef),
          ]);

          const existing = userDoc.exists()
            ? (userDoc.data() as Record<string, unknown>)
            : null;
          const doctor = doctorDoc.exists()
            ? (doctorDoc.data() as Record<string, unknown>)
            : null;
          const merged = buildDefaultProfile(
            firebaseUser,
            adminEmails,
            existing,
            doctor,
          );

          await setDoc(userDocRef, merged, { merge: true });
          return merged;
        };

        userData = await withTimeout(hydrateUser(), bootstrapTimeoutMs);
      } catch (err) {
        degraded = true;
        error = err instanceof Error ? err.message : 'bootstrap_failed';
        console.error('Auth hydration failed:', err);
        userData = firebaseUser
          ? {
              ...buildDefaultProfile(firebaseUser, adminEmails),
              degraded: true,
            }
          : null;
      } finally {
        setState({
          user: firebaseUser,
          userData,
          loading: false,
          degraded,
          error,
        });
      }
    });

    return () => unsubscribe();
  }, [bootstrapTimeoutMs]);

  return (
    <FirebaseContext.Provider value={state}>
      {children}
    </FirebaseContext.Provider>
  );
};
