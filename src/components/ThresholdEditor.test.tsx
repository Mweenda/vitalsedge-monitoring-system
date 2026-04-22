import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThresholdEditor } from './ThresholdEditor';
import { PatientData } from '../types';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
  handleFirestoreError: vi.fn(),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write'
  }
}));

vi.mock('./FirebaseProvider', () => ({
  useFirebase: () => ({ userData: { role: 'CLINICIAN', uid: 'test-user' }, degraded: false }),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

describe('ThresholdEditor', () => {
  const mockPatient: PatientData = {
    id: 'patient-1',
    mrn: 'MRN-001',
    age: 44,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    email: 'john.doe@example.com',
    phone: '555-1234',
    deviceId: 'DEV-001',
    condition: 'CHF',
    clinicId: 'clinic-1',
    status: 'active',
    thresholds: {
      hr: { min: 60, max: 100 },
      spo2: { min: 95, max: 100 },
      temperature: { min: 36.0, max: 38.0 },
      glucose: { min: 70, max: 120 },
      systolicBP: { min: 90, max: 140 },
      diastolicBP: { min: 60, max: 90 }
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '555-5678'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient information correctly', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getByText('Alert Thresholds')).toBeInTheDocument();
    const patientLines = screen.getAllByText((_, el) =>
      Boolean(el?.textContent?.includes('John') && el?.textContent?.includes('CHF')),
    );
    expect(patientLines.length).toBeGreaterThanOrEqual(1);
  });

  it('displays current threshold values', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const hrCard = screen.getByText('Heart Rate').closest('.bg-gray-50')!;
    expect(within(hrCard).getByDisplayValue('60')).toBeInTheDocument();
    expect(within(hrCard).getByDisplayValue('100')).toBeInTheDocument();

    const spo2Card = screen.getByText('SpO2').closest('.bg-gray-50')!;
    expect(within(spo2Card).getByDisplayValue('95')).toBeInTheDocument();
    expect(within(spo2Card).getByDisplayValue('100')).toBeInTheDocument();
  });

  it('inputs are disabled by default', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('enables editing when Edit button is clicked', async () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  it('allows changing threshold values in edit mode', async () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).not.toBeDisabled();
    });

    // Change heart rate minimum
    const hrMinInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(hrMinInput, { target: { value: '65' } });

    expect(hrMinInput).toHaveValue(65);
  });

  it('validates threshold ranges', async () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).not.toBeDisabled();
    });

    // Set invalid range (min >= max)
    const hrMinInput = screen.getAllByRole('spinbutton')[0]; // HR min
    const hrMaxInput = screen.getAllByRole('spinbutton')[1]; // HR max
    
    fireEvent.change(hrMinInput, { target: { value: '100' } });
    fireEvent.change(hrMaxInput, { target: { value: '90' } });

    // Try to save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Heart Rate: Minimum must be less than maximum/)).toBeInTheDocument();
    });
  });

  it('cancels edits and restores original values', async () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).not.toBeDisabled();
    });

    // Change a value
    const hrMinInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(hrMinInput, { target: { value: '65' } });

    // Cancel edit
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(hrMinInput).toHaveValue(60); // Should be back to original value
      expect(hrMinInput).toBeDisabled(); // Should be disabled again
    });
  });

  it('saves thresholds successfully', async () => {
    const { doc, updateDoc, addDoc, collection } = await import('firebase/firestore');
    
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValue({ id: 'audit-log-id' });

    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).not.toBeDisabled();
    });

    // Change a value
    const hrMinInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(hrMinInput, { target: { value: '65' } });

    // Save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Thresholds saved successfully!')).toBeInTheDocument();
    });

    expect(updateDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      hr: expect.objectContaining({ min: 65, max: 100 })
    }));
  });

  it('shows error message when save fails', async () => {
    const { updateDoc } = await import('firebase/firestore');
    
    vi.mocked(updateDoc).mockRejectedValue(new Error('Save failed'));

    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit Thresholds');
    fireEvent.click(editButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).not.toBeDisabled();
    });

    // Save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save thresholds. Please try again.')).toBeInTheDocument();
    });
  });

  it('closes when Close button is clicked', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays correct alert range text', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getAllByText('Alert Range:').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/<\s*60\s*or\s*>\s*100\s*BPM/)).toBeInTheDocument();
    expect(screen.getByText(/<\s*95\s*or\s*>\s*100\s*%/)).toBeInTheDocument();
  });

  it('shows all threshold fields', () => {
    render(
      <ThresholdEditor 
        patient={mockPatient} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const expectedLabels = [
      'Heart Rate',
      'SpO2',
      'Temperature',
      'Glucose',
      'Systolic BP',
      'Diastolic BP'
    ];

    expectedLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
