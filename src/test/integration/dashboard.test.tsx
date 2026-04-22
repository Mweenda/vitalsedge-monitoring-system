import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Dashboard } from '../../components/Dashboard';
import { FirebaseProvider } from '../../components/FirebaseProvider';

const firebaseBarrel = vi.hoisted(() => {
  const auth = {
    currentUser: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  };
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
  signOut: vi.fn(),
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

describe('Dashboard Integration Tests', () => {
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

  const mockUserDoc = {
    exists: () => true,
    data: () => ({
      role: 'CARDIOLOGIST',
      clinicId: 'clinic-123',
      name: 'Dr. Test User',
    }),
  };

  describe('Dashboard Loading and Initialization', () => {
    it('loads dashboard with patient data', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
          {
            id: 'patient-2',
            data: () => ({
              name: 'Jane Smith',
              dateOfBirth: '1985-05-15',
              medicalRecordNumber: 'MRN002',
              status: 'active',
            }),
          },
        ],
      });

      mockOnSnapshot.mockReturnValue(vi.fn());

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      
      mockGetDoc.mockImplementation(() => new Promise(() => {}));

      renderWithProvider(<Dashboard />);

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });
  });

  describe('Patient Management Integration', () => {
    it('allows searching and filtering patients', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
          {
            id: 'patient-2',
            data: () => ({
              name: 'Jane Smith',
              dateOfBirth: '1985-05-15',
              medicalRecordNumber: 'MRN002',
              status: 'active',
            }),
          },
        ],
      });

      mockOnSnapshot.mockReturnValue(vi.fn());

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search patients/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('opens patient details view', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
        ],
      });

      mockOnSnapshot.mockReturnValue(vi.fn());

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientCard = screen.getByText('John Doe').closest('[data-testid="patient-card"]');
      fireEvent.click(patientCard!);

      await waitFor(() => {
        expect(screen.getByText(/Patient Details/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('MRN001')).toBeInTheDocument();
      });
    });
  });

  describe('Vitals Monitoring Integration', () => {
    it('displays real-time vitals for selected patient', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
        ],
      });

      let vitalsCallback: (data: any) => void;
      mockOnSnapshot.mockImplementation((query, callback) => {
        vitalsCallback = callback;
        return vi.fn();
      });

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientCard = screen.getByText('John Doe').closest('[data-testid="patient-card"]');
      fireEvent.click(patientCard!);

      await waitFor(() => {
        expect(screen.getByText(/Patient Details/i)).toBeInTheDocument();
      });

      const mockVitalsData = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        oxygenSaturation: 98,
        temperature: 98.6,
        timestamp: new Date(),
      };

      vitalsCallback!({
        docs: [
          {
            id: 'vitals-1',
            data: () => mockVitalsData,
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('120/80')).toBeInTheDocument();
        expect(screen.getByText('98%')).toBeInTheDocument();
      });
    });

    it('shows alerts for abnormal vitals', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const { validateVitals } = await import('../../utils/vitalsValidation');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
        ],
      });

      vi.mocked(validateVitals).mockReturnValue({
        isValid: false,
        anomalies: ['Heart rate too high'],
      });

      let vitalsCallback: (data: any) => void;
      mockOnSnapshot.mockImplementation((query, callback) => {
        vitalsCallback = callback;
        return vi.fn();
      });

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientCard = screen.getByText('John Doe').closest('[data-testid="patient-card"]');
      fireEvent.click(patientCard!);

      const mockVitalsData = {
        heartRate: 150,
        bloodPressure: { systolic: 120, diastolic: 80 },
        oxygenSaturation: 98,
        temperature: 98.6,
        timestamp: new Date(),
      };

      vitalsCallback!({
        docs: [
          {
            id: 'vitals-1',
            data: () => mockVitalsData,
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText(/Alert/i)).toBeInTheDocument();
        expect(screen.getByText(/Heart rate too high/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Export Integration', () => {
    it('exports patient data to CSV', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
        ],
      });

      mockOnSnapshot.mockReturnValue(vi.fn());

      const mockCreateObjectURL = vi.fn();
      const mockRevokeObjectURL = vi.fn();
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      const csvOption = screen.getByText(/CSV/i);
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('exports patient data to XLSX', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      mockGetDoc.mockResolvedValue(mockUserDoc);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'patient-1',
            data: () => ({
              name: 'John Doe',
              dateOfBirth: '1980-01-01',
              medicalRecordNumber: 'MRN001',
              status: 'active',
            }),
          },
        ],
      });

      mockOnSnapshot.mockReturnValue(vi.fn());

      const mockCreateObjectURL = vi.fn();
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      const xlsxOption = screen.getByText(/XLSX/i);
      fireEvent.click(xlsxOption);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles database errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      
      mockGetDoc.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('shows retry option on error', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      
      mockGetDoc
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce(mockUserDoc);

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Integration', () => {
    it('shows appropriate features for cardiologist role', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      const cardiologistUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'CARDIOLOGIST',
          clinicId: 'clinic-123',
          name: 'Dr. Test User',
        }),
      };
      
      mockGetDoc.mockResolvedValue(cardiologistUserDoc);
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockOnSnapshot.mockReturnValue(vi.fn());

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Manage Patients/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Advanced Analytics/i })).toBeInTheDocument();
      });
    });

    it('shows limited features for nurse role', async () => {
      const { getDoc, getDocs, onSnapshot } = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(getDoc);
      const mockGetDocs = vi.mocked(getDocs);
      const mockOnSnapshot = vi.mocked(onSnapshot);
      
      const nurseUserDoc = {
        exists: () => true,
        data: () => ({
          role: 'NURSE',
          clinicId: 'clinic-123',
          name: 'Nurse Test User',
        }),
      };
      
      mockGetDoc.mockResolvedValue(nurseUserDoc);
      mockGetDocs.mockResolvedValue({ docs: [] });
      mockOnSnapshot.mockReturnValue(vi.fn());

      renderWithProvider(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Manage Patients/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Advanced Analytics/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /View Patients/i })).toBeInTheDocument();
      });
    });
  });
});
