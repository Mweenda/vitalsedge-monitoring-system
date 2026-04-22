import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingFlow from './OnboardingFlow';
import { FirebaseProvider } from './FirebaseProvider';

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

vi.mock('../firebase', () => ({
  auth: firebaseBarrel.auth,
  db: {},
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: firebaseBarrel.onAuthStateChanged,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('OnboardingFlow Component', () => {
  const mockOnComplete = vi.fn();

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

  it('renders the first step of onboarding', () => {
    renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/Patient Enrollment/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
  });

  it('validates required fields on step 1', async () => {
    renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);
    
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });
  });

  it('allows navigation between steps', async () => {
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
  });

  it('shows previous button after first step', async () => {
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
      expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    });
  });

  it('validates medical record number format', async () => {
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
    
    const nextButtonStep2 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButtonStep2);
    
    await waitFor(() => {
      expect(screen.getByText(/Medical record number is required/i)).toBeInTheDocument();
    });
  });

  it('completes onboarding after all steps', async () => {
    const { setDoc } = await import('firebase/firestore');
    vi.mocked(setDoc).mockResolvedValue(undefined);
    
    renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);
    
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
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('shows error when terms are not accepted', async () => {
    renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);
    
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      
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
      
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        if (i < 3) {
          expect(screen.getByText(new RegExp(`Step ${i + 2} of 5`))).toBeInTheDocument();
        }
      });
    }
    
    const completeButton = screen.getByRole('button', { name: /Complete Enrollment/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/You must accept the terms to continue/i)).toBeInTheDocument();
    });
  });

  it('allows cancellation of onboarding', () => {
    renderWithProvider(<OnboardingFlow onComplete={mockOnComplete} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
