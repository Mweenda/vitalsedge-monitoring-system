import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';

const firebaseBarrel = vi.hoisted(() => {
  const auth = { currentUser: null as unknown };
  const onAuthStateChanged = vi.fn((_auth: typeof auth, callback: (user: unknown) => void) => {
    queueMicrotask(() => callback(_auth.currentUser));
    return () => {};
  });
  return { auth, onAuthStateChanged };
});

vi.mock('../firebase', () => ({
  auth: firebaseBarrel.auth,
  db: {},
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('FirebaseProvider Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides auth context to children', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      queueMicrotask(() => callback(null));
      return () => {};
    });

    const TestComponent = () => {
      const { user, loading } = useFirebase();

      return (
        <div>
          {loading ? <div>Loading...</div> : <div>{user ? 'Logged in' : 'Logged out'}</div>}
        </div>
      );
    };

    render(
      <FirebaseProvider>
        <TestComponent />
      </FirebaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Logged out')).toBeInTheDocument();
    });
  });

  it('handles user authentication state changes', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    
    const mockUser = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      setTimeout(() => callback(mockUser), 100);
      return () => {};
    });

    const TestComponent = () => {
      const { user, loading } = useFirebase();

      return (
        <div>
          {loading ? <div>Loading...</div> : <div>{user?.email || 'No user'}</div>}
        </div>
      );
    };

    render(
      <FirebaseProvider>
        <TestComponent />
      </FirebaseProvider>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('provides user role information', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const { getDoc: firestoreGetDoc } = await import('firebase/firestore');

    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    const mockGetDoc = vi.mocked(firestoreGetDoc);
    
    const mockUser = {
      uid: 'test-user',
      email: 'test@example.com',
    };

    const mockUserDoc = {
      exists: () => true,
      data: () => ({
        role: 'CARDIOLOGIST',
        clinicId: 'clinic-123',
      }),
    };

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      queueMicrotask(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockResolvedValue(mockUserDoc);

    const TestComponent = () => {
      const { userData, loading } = useFirebase();

      return (
        <div>
          {loading ? <div>Loading...</div> : <div>{userData?.role || 'No role'}</div>}
        </div>
      );
    };

    render(
      <FirebaseProvider>
        <TestComponent />
      </FirebaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('CARDIOLOGIST')).toBeInTheDocument();
    });
  });

  it('handles sign out functionality', async () => {
    const { onAuthStateChanged, signOut } = await import('firebase/auth');
    const { auth } = await import('../firebase');
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    const mockSignOut = vi.mocked(signOut);

    const mockUser = {
      uid: 'test-user',
      email: 'test@example.com',
    };

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      queueMicrotask(() => callback(mockUser));
      return () => {};
    });

    mockSignOut.mockResolvedValue(undefined);

    const TestComponent = () => {
      const { user } = useFirebase();

      const handleSignOut = async () => {
        await signOut(auth);
      };

      return (
        <div>
          <div>{user?.email || 'No user'}</div>
          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      );
    };

    render(
      <FirebaseProvider>
        <TestComponent />
      </FirebaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });
  });

  it('handles errors during user data fetch', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const { getDoc } = await import('firebase/firestore');
    
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    const mockGetDoc = vi.mocked(getDoc);
    
    const mockUser = {
      uid: 'test-user',
      email: 'test@example.com',
    };

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      queueMicrotask(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockRejectedValue(new Error('Failed to fetch user data'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FirebaseProvider>
        <div>Test Child</div>
      </FirebaseProvider>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Auth hydration failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('cleans up auth state listener on unmount', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
    
    const mockUnsubscribe = vi.fn();
    mockOnAuthStateChanged.mockImplementation(() => mockUnsubscribe);

    const { unmount } = render(
      <FirebaseProvider>
        <div>Test Child</div>
      </FirebaseProvider>,
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
