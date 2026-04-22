import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingFlow from '../../components/OnboardingFlow';
import { FirebaseProvider } from '../../components/FirebaseProvider';

const firebaseBarrel = vi.hoisted(() => {
  const auth = {
    currentUser: { uid: 'test-user', email: 'test@example.com' },
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
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('Patient Enrollment Integration Tests', () => {
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

  describe('Complete Enrollment Flow', () => {
    it('successfully enrolls a new patient through all steps', async () => {
      const { setDoc, addDoc } = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(setDoc);
      const mockAddDoc = vi.mocked(addDoc);
      
      mockSetDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'enrollment-123' });

      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      expect(screen.getByText(/Patient Enrollment/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });

      let nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
      });

      const medicalRecordInput = screen.getByLabelText(/Medical Record Number/i);
      fireEvent.change(medicalRecordInput, { target: { value: 'MRN123456' } });

      nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/i)).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 4 of 5/i)).toBeInTheDocument();
      });

      const emergencyContactInput = screen.getByLabelText(/Emergency Contact Name/i);
      const emergencyPhoneInput = screen.getByLabelText(/Emergency Contact Phone/i);

      fireEvent.change(emergencyContactInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emergencyPhoneInput, { target: { value: '555-123-4567' } });

      nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 5 of 5/i)).toBeInTheDocument();
      });

      const termsCheckbox = screen.getByRole('checkbox', { name: /I agree to the terms/i });
      fireEvent.click(termsCheckbox);

      const completeButton = screen.getByRole('button', { name: /Complete Enrollment/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            medicalRecordNumber: 'MRN123456',
            emergencyContactName: 'Jane Doe',
            emergencyContactPhone: '555-123-4567',
            status: 'active',
            enrolledBy: 'test-user',
          })
        );
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('validates each step before proceeding', async () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Date of birth is required/i)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/First Name/i);
      fireEvent.change(firstNameInput, { target: { value: 'John' } });

      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
      });
    });

    it('allows navigation back to previous steps', async () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
      });

      const previousButton = screen.getByRole('button', { name: /Previous/i });
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
        expect(firstNameInput).toHaveValue('John');
        expect(lastNameInput).toHaveValue('Doe');
      });
    });

    it('cancels enrollment and calls onComplete', () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Data Persistence Integration', () => {
    it('saves patient data to Firestore with correct structure', async () => {
      const { setDoc } = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(setDoc);
      mockSetDoc.mockResolvedValue(undefined);

      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

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
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            createdAt: expect.any(Object),
            updatedAt: expect.any(Object),
          })
        );
      });
    });

    it('creates audit log for patient enrollment', async () => {
      const { setDoc, addDoc } = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(setDoc);
      const mockAddDoc = vi.mocked(addDoc);
      
      mockSetDoc.mockResolvedValue(undefined);
      mockAddDoc.mockResolvedValue({ id: 'audit-123' });

      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

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
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            action: 'PATIENT_ENROLLED',
            userId: 'test-user',
            patientName: 'John Doe',
            timestamp: expect.any(Object),
          })
        );
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles database errors during enrollment', async () => {
      const { setDoc } = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(setDoc);
      mockSetDoc.mockRejectedValue(new Error('Database write failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

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
        expect(screen.getByText(/Failed to enroll patient/i)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Enrollment error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('allows retry after enrollment failure', async () => {
      const { setDoc } = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(setDoc);
      
      mockSetDoc
        .mockRejectedValueOnce(new Error('Database write failed'))
        .mockResolvedValueOnce(undefined);

      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

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
        expect(screen.getByText(/Failed to enroll patient/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('validates medical record number format', async () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
      });

      const medicalRecordInput = screen.getByLabelText(/Medical Record Number/i);
      fireEvent.change(medicalRecordInput, { target: { value: 'invalid' } });

      const nextButtonStep2 = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButtonStep2);

      await waitFor(() => {
        expect(screen.getByText(/Medical record number must be valid/i)).toBeInTheDocument();
      });
    });

    it('validates emergency contact phone number', async () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      for (let i = 0; i < 3; i++) {
        const firstNameInput = screen.getByLabelText(/First Name/i);
        const lastNameInput = screen.getByLabelText(/Last Name/i);
        const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

        if (i === 0) {
          fireEvent.change(firstNameInput, { target: { value: 'John' } });
          fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
          fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });
        } else if (i === 1) {
          const medicalRecordInput = screen.getByLabelText(/Medical Record Number/i);
          fireEvent.change(medicalRecordInput, { target: { value: 'MRN123456' } });
        }

        const nextButton = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Step 4 of 5/i)).toBeInTheDocument();
      });

      const emergencyPhoneInput = screen.getByLabelText(/Emergency Contact Phone/i);
      fireEvent.change(emergencyPhoneInput, { target: { value: 'invalid-phone' } });

      const nextButtonStep4 = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButtonStep4);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('ensures terms acceptance before completion', async () => {
      const mockOnComplete = vi.fn();
      renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);

      for (let i = 0; i < 4; i++) {
        if (i === 0) {
          const firstNameInput = screen.getByLabelText(/First Name/i);
          const lastNameInput = screen.getByLabelText(/Last Name/i);
          const dateOfBirthInput = screen.getByLabelText(/Date of Birth/i);

          fireEvent.change(firstNameInput, { target: { value: 'John' } });
          fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
          fireEvent.change(dateOfBirthInput, { target: { value: '1990-01-01' } });
        } else if (i === 1) {
          const medicalRecordInput = screen.getByLabelText(/Medical Record Number/i);
          fireEvent.change(medicalRecordInput, { target: { value: 'MRN123456' } });
        } else if (i === 3) {
          const emergencyContactInput = screen.getByLabelText(/Emergency Contact Name/i);
          const emergencyPhoneInput = screen.getByLabelText(/Emergency Contact Phone/i);

          fireEvent.change(emergencyContactInput, { target: { value: 'Jane Doe' } });
          fireEvent.change(emergencyPhoneInput, { target: { value: '555-123-4567' } });
        }

        const nextButton = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Step 5 of 5/i)).toBeInTheDocument();
      });

      const completeButton = screen.getByRole('button', { name: /Complete Enrollment/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/You must accept the terms to continue/i)).toBeInTheDocument();
      });
    });
  });
});
