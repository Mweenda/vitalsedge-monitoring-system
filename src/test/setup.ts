import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type firebase from 'firebase/firestore';
import type auth from 'firebase/auth';

const mockFirebaseAuth = {
  currentUser: null,
  languageCode: 'en',
  settings: {} as { isUnofficialWebExporterEnabled?: boolean },
  operations: [] as unknown[],
};

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof firebase>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    getDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc', exists: () => false, data: () => undefined })),
    setDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    collection: vi.fn(() => 'mock-collection'),
    query: vi.fn(),
    where: vi.fn(() => () => true),
    orderBy: vi.fn(() => () => 'mock'),
    limit: vi.fn(() => () => 'mock'),
    onSnapshot: vi.fn(() => () => {}),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    serverTimestamp: vi.fn(() => new Date().toISOString()),
    getFirestore: vi.fn(() => ({})),
    connectFirestoreEmulator: vi.fn(),
  };
});

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof auth>('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => mockFirebaseAuth),
    onAuthStateChanged: vi.fn((_auth: typeof mockFirebaseAuth, callback: (user: null) => void) => {
      queueMicrotask(() => callback(null));
      return () => {};
    }),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
    signOut: vi.fn(() => Promise.resolve()),
    updateProfile: vi.fn(() => Promise.resolve()),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
    GoogleAuthProvider: vi.fn(() => ({ providerId: 'google.com' })),
    EmailAuthProvider: vi.fn(() => ({ providerId: 'password' })),
    browserSessionPersistence: 'session',
    connectAuthEmulator: vi.fn(),
  };
});

vi.mock('firebase/storage', async () => {
  const actual = await vi.importActual('firebase/storage');
  return {
    ...actual,
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(() => ({ path: 'mock' })),
    uploadBytes: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.png')),
    connectStorageEmulator: vi.fn(),
  };
});