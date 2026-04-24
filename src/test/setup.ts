import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
    setDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    collection: vi.fn(() => 'mock-collection'),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(() => () => {}),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    serverTimestamp: vi.fn(() => new Date()),
    getFirestore: vi.fn(() => ({})),
  };
});

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => ({
      currentUser: null,
      languageCode: 'en',
    })),
    onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: null) => void) => {
      callback(null);
      return () => {};
    }),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
    signOut: vi.fn(() => Promise.resolve()),
    updateProfile: vi.fn(() => Promise.resolve()),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    EmailAuthProvider: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.png')),
}));