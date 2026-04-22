import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../../components/Login';
import { PasswordReset } from '../../components/PasswordReset';
import { FirebaseProvider } from '../../components/FirebaseProvider';

const firebaseBarrel = vi.hoisted(() => {
  const auth = { currentUser: null as unknown };
  const onAuthStateChanged = vi.fn((_auth: typeof auth, callback: (user: unknown) => void) => {
    queueMicrotask(() => callback(_auth.currentUser));
    return () => {};
  });
  return { auth, onAuthStateChanged };
});

vi.mock('../../firebase', () => ({
  auth: firebaseBarrel.auth,
  db: {},
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <FirebaseProvider>
        {component}
      </FirebaseProvider>
    );
  };

  describe('Login Flow Integration', () => {
    it('completes full login flow successfully', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);

      renderWithProvider(<Login />);

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      fireEvent.click(checkbox);

      const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });
    });

    it('handles login failure and allows retry', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      
      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ user: { uid: 'test-user' } } as any);

      renderWithProvider(<Login />);

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      fireEvent.click(checkbox);

      const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
      });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Password Reset Integration', () => {
    it('completes password reset flow successfully', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const mockOnBack = vi.fn();
      renderWithProvider(<PasswordReset onBack={mockOnBack} />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({}, 'test@example.com');
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back to Login/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('handles password reset errors gracefully', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
      mockSendPasswordResetEmail.mockRejectedValue({ code: 'auth/user-not-found' });

      const mockOnBack = vi.fn();
      renderWithProvider(<PasswordReset onBack={mockOnBack} />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/No account found with this email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Persistence', () => {
    it('maintains auth state across component re-renders', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const TestComponent = () => {
        const { user, loading } = React.useContext(
          (React as any).createContext({ user: null, loading: true })
        );
        
        if (loading) return <div>Loading...</div>;
        return <div>{user ? `Logged in as ${user.email}` : 'Not logged in'}</div>;
      };

      const { rerender } = renderWithProvider(<TestComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      authCallback!(mockUser);

      await waitFor(() => {
        expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
      });

      rerender(
        <FirebaseProvider>
          <TestComponent />
        </FirebaseProvider>
      );

      expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('handles session timeout appropriately', async () => {
      const { onAuthStateChanged, signOut } = await import('firebase/auth');
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      const mockSignOut = vi.mocked(signOut);
      
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
      };

      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      mockSignOut.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { user, loading, signOut: contextSignOut } = React.useContext(
          (React as any).createContext({ 
            user: null, 
            loading: true, 
            signOut: vi.fn() 
          })
        );
        
        const handleSignOut = async () => {
          await contextSignOut();
        };
        
        if (loading) return <div>Loading...</div>;
        return (
          <div>
            <div>{user ? `Logged in as ${user.email}` : 'Not logged in'}</div>
            {user && <button onClick={handleSignOut}>Sign Out</button>}
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      authCallback!(mockUser);

      await waitFor(() => {
        expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors during authentication', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      
      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockRejectedValue(new Error('Network unavailable'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProvider(<Login />);

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      fireEvent.click(checkbox);

      const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('shows support message when Google auth reports configuration-not-found', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);

      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockRejectedValue({
        code: 'auth/configuration-not-found',
        message: 'Configuration not found',
      } as any);

      renderWithProvider(<Login />);

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      fireEvent.click(checkbox);

      const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Google authentication is not properly configured/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Auth Integration', () => {
    it('shares auth state between Login and PasswordReset components', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      
      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const AuthTestComponent = () => {
        const { user } = React.useContext(
          (React as any).createContext({ user: null, loading: false })
        );
        
        return (
          <div>
            <div data-testid="auth-state">{user ? 'authenticated' : 'unauthenticated'}</div>
            {user ? <div data-testid="user-email">{user.email}</div> : <Login />}
          </div>
        );
      };

      renderWithProvider(<AuthTestComponent />);

      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();

      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
      };

      authCallback!(mockUser);

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });
  });
});
