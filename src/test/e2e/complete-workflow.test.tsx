import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../../components/Login';
import { Dashboard } from '../../components/Dashboard';
import OnboardingFlow from '../../components/OnboardingFlow';
import { EdgeDevice } from '../../components/EdgeDevice';
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
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('../../utils/vitalsValidation', () => ({
  validateVitals: vi.fn(() => ({ isValid: true, anomalies: [] })),
}));

describe('Complete End-to-End Workflow Tests', () => {
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

  describe('Complete User Journey', () => {
    it('completes full journey from login to patient monitoring', async () => {
      const { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } = await import('firebase/auth');
      const { getDoc, getDocs, setDoc, onSnapshot } = await import('firebase/firestore');
      
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockSetDoc = vi.mocked(setDoc);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Dr. Test User',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'CARDIOLOGIST',
          clinicId: 'clinic-123',
          name: 'Dr. Test User',
        }),
      };

      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockSetDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockReturnValue(vi.fn());

      const App = () => {
        const [currentView, setCurrentView] = React.useState<'login' | 'dashboard' | 'enrollment' | 'monitoring'>('login');
        const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null);

        const handleLogin = () => {
          authCallback!(mockUser);
          setCurrentView('dashboard');
        };

        const handleEnrollmentComplete = () => {
          setCurrentView('dashboard');
        };

        const handlePatientSelect = (patientId: string) => {
          setSelectedPatient(patientId);
          setCurrentView('monitoring');
        };

        switch (currentView) {
          case 'login':
            return <Login />;
          case 'dashboard':
            return <Dashboard onPatientSelect={handlePatientSelect} onEnrollPatient={() => setCurrentView('enrollment')} />;
          case 'enrollment':
            return <OnboardingFlow onComplete={handleEnrollmentComplete} />;
          case 'monitoring':
            return <EdgeDevice patientId={selectedPatient || ''} onBack={() => setCurrentView('dashboard')} />;
          default:
            return <Login />;
        }
      };

      renderWithProvider(<App />);

      expect(screen.getByText('VitalsEdge')).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      fireEvent.click(checkbox);

      const loginButton = screen.getByRole('button', { name: /Continue with Google/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      const enrollButton = screen.getByRole('button', { name: /Enroll New Patient/i });
      fireEvent.click(enrollButton);

      await waitFor(() => {
        expect(screen.getByText(/Patient Enrollment/i)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });

      for (let i = 0; i < 4; i++) {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextButton);
      }

      const termsCheckbox = screen.getByRole('checkbox', { name: /I agree to the terms/i });
      fireEvent.click(termsCheckbox);

      const completeButton = screen.getByRole('button', { name: /Complete Enrollment/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-123',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1990-01-01',
              medicalRecordNumber: 'MRN123456',
              status: 'active',
            }),
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientCard = screen.getByText('John Doe').closest('[data-testid="patient-card"]');
      fireEvent.click(patientCard!);

      await waitFor(() => {
        expect(screen.getByText(/Edge Device Monitor/i)).toBeInTheDocument();
        expect(screen.getByText(/Patient ID: patient-123/i)).toBeInTheDocument();
      });

      const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
      fireEvent.click(manualInputButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Heart Rate/i)).toBeInTheDocument();
      });

      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      const systolicInput = screen.getByLabelText(/Systolic BP/i);
      const diastolicInput = screen.getByLabelText(/Diastolic BP/i);
      const oxygenInput = screen.getByLabelText(/Oxygen Saturation/i);

      fireEvent.change(heartRateInput, { target: { value: '75' } });
      fireEvent.change(systolicInput, { target: { value: '120' } });
      fireEvent.change(diastolicInput, { target: { value: '80' } });
      fireEvent.change(oxygenInput, { target: { value: '98' } });

      const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vitals saved successfully/i)).toBeInTheDocument();
      });
    });

    it('handles error scenarios throughout the workflow', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      
      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockRejectedValue(new Error('Authentication failed'));

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
  });

  describe('Multi-Role Workflow', () => {
    it('adapts workflow for different user roles', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { getDoc, getDocs } = await import('firebase/firestore');
      
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      
      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const testRoleWorkflow = async (role: string, expectedFeatures: string[]) => {
        const mockUser = {
          uid: 'test-user',
          email: 'test@example.com',
        };

        const mockUserDoc = {
          exists: () => true,
          data: () => ({
            role,
            clinicId: 'clinic-123',
            name: 'Test User',
          }),
        };

        mockGetDoc.mockResolvedValue(mockUserDoc);
        mockGetDocs.mockResolvedValue({ docs: [] });

        const { unmount } = renderWithProvider(<Dashboard />);

        authCallback!(mockUser);

        await waitFor(() => {
          expectedFeatures.forEach(feature => {
            if (feature.includes('not')) {
              const elementToCheck = feature.replace('not ', '');
              expect(screen.queryByText(elementToCheck)).not.toBeInTheDocument();
            } else {
              expect(screen.getByText(feature)).toBeInTheDocument();
            }
          });
        });

        unmount();
      };

      await testRoleWorkflow('CARDIOLOGIST', ['Manage Patients', 'Advanced Analytics']);
      await testRoleWorkflow('NURSE', ['not Manage Patients', 'View Patients']);
      await testRoleWorkflow('ADMIN', ['Manage Users', 'System Settings']);
    });
  });

  describe('Data Consistency Workflow', () => {
    it('maintains data consistency across components', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { getDoc, getDocs, setDoc, onSnapshot } = await import('firebase/firestore');
      
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockSetDoc = vi.mocked(setDoc);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'CARDIOLOGIST',
          clinicId: 'clinic-123',
          name: 'Dr. Test User',
        }),
      };

      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockSetDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockReturnValue(vi.fn());

      const { rerender } = renderWithProvider(<Dashboard />);

      authCallback!(mockUser);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-123',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1990-01-01',
              medicalRecordNumber: 'MRN123456',
              status: 'active',
            }),
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      rerender(
        <FirebaseProvider>
          <OnboardingFlow onComplete={vi.fn()} />
        </FirebaseProvider>
      );

      expect(screen.getByText(/Patient Enrollment/i)).toBeInTheDocument();

      rerender(
        <FirebaseProvider>
          <Dashboard />
        </FirebaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('handles large datasets efficiently', async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { getDoc, getDocs } = await import('firebase/firestore');
      
      const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      
      let authCallback: (user: any) => void;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'CARDIOLOGIST',
          clinicId: 'clinic-123',
          name: 'Dr. Test User',
        }),
      };

      const largePatientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `patient-${i}`,
        data: () => ({
          name: `Patient ${i}`,
          dateOfBirth: '1990-01-01',
          medicalRecordNumber: `MRN${i.toString().padStart(6, '0')}`,
          status: 'active',
        }),
      }));

      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({ docs: largePatientList });

      const startTime = performance.now();
      renderWithProvider(<Dashboard />);
      
      authCallback!(mockUser);

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility Workflow', () => {
    it('maintains accessibility throughout the user journey', async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const mockSignInWithPopup = vi.mocked(signInWithPopup);
      const mockGoogleAuthProvider = vi.mocked(GoogleAuthProvider);
      
      mockGoogleAuthProvider.mockImplementation(() => ({} as any));
      mockSignInWithPopup.mockResolvedValue({ user: { uid: 'test-user' } } as any);

      renderWithProvider(<Login />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
      expect(skipLink).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox', { name: /terms/i });
      expect(checkbox).toBeInTheDocument();

      const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
      expect(loginButton).toBeInTheDocument();

      expect(loginButton).toHaveAttribute('type', 'submit');
    });
  });
});
