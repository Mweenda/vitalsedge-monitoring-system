import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientRoster } from './PatientRoster';
import { PatientData, Anomaly } from '../types';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } }
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

describe('PatientRoster', () => {
  const mockPatients: PatientData[] = [
    {
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
    },
    {
      id: 'patient-2',
      mrn: 'MRN-002',
      age: 49,
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1975-05-15',
      email: 'jane.smith@example.com',
      phone: '555-5678',
      deviceId: 'DEV-002',
      condition: 'COPD',
      clinicId: 'clinic-1',
      status: 'discharged',
      thresholds: {
        hr: { min: 60, max: 100 },
        spo2: { min: 95, max: 100 },
        temperature: { min: 36.0, max: 38.0 },
        glucose: { min: 70, max: 120 },
        systolicBP: { min: 90, max: 140 },
        diastolicBP: { min: 60, max: 90 }
      },
      emergencyContact: {
        name: 'Bob Smith',
        relationship: 'Husband',
        phone: '555-9012'
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    },
    {
      id: 'patient-3',
      mrn: 'MRN-003',
      age: 64,
      firstName: 'Bob',
      lastName: 'Johnson',
      dateOfBirth: '1960-03-20',
      email: 'bob.johnson@example.com',
      phone: '555-3456',
      deviceId: 'DEV-003',
      condition: 'Diabetes',
      clinicId: 'clinic-2',
      status: 'transferred',
      thresholds: {
        hr: { min: 60, max: 100 },
        spo2: { min: 95, max: 100 },
        temperature: { min: 36.0, max: 38.0 },
        glucose: { min: 70, max: 120 },
        systolicBP: { min: 90, max: 140 },
        diastolicBP: { min: 60, max: 90 }
      },
      emergencyContact: {
        name: 'Mary Johnson',
        relationship: 'Daughter',
        phone: '555-7890'
      },
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    }
  ];

  const mockAlerts: Anomaly[] = [
    {
      id: 'alert-1',
      patientId: 'patient-1',
      type: 'tachycardia',
      severity: 'medium',
      message: 'Heart rate above threshold',
      timestamp: '2024-01-01T12:00:00Z',
      value: 120,
      acknowledged: false
    },
    {
      id: 'alert-2',
      patientId: 'patient-1',
      type: 'hypoxia',
      severity: 'high',
      message: 'SpO2 below threshold',
      timestamp: '2024-01-01T12:30:00Z',
      value: 92,
      acknowledged: false
    }
  ];

  const mockOnPatientSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient roster with correct header', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    expect(screen.getByRole('heading', { name: /patients/i })).toBeInTheDocument();
    expect(screen.getByText('3 patients')).toBeInTheDocument();
  });

  it('displays all patients', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows patient status badges', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('discharged')).toBeInTheDocument();
    expect(screen.getByText('transferred')).toBeInTheDocument();
  });

  it('shows patient condition badges', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    expect(screen.getAllByText('CHF').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('COPD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Diabetes').length).toBeGreaterThanOrEqual(1);
  });

  it('displays alert counts correctly', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    // Patient 1 has 2 alerts
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Patients 2 and 3 have 0 alerts (emerald check icons, no numeric badge)
    expect(screen.getAllByText('2')).toHaveLength(1);
  });

  it('filters patients by search term', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search patients...');
    fireEvent.change(searchInput, { target: { value: 'jane.smith' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });
  });

  it('filters patients by condition', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const conditionFilter = screen.getByDisplayValue('All Conditions');
    fireEvent.change(conditionFilter, { target: { value: 'CHF' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });
  });

  it('filters patients by status', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const statusFilter = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });
  });

  it('sorts patients by name', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const sortButton = screen.getByRole('button', { name: /sort patient list/i });
    fireEvent.click(sortButton);

    // Select "Name (Z-A)" option
    const zToAOption = screen.getByText('Name (Z-A)');
    fireEvent.click(zToAOption);

    await waitFor(() => {
      const names = screen
        .getAllByRole('heading', { level: 3 })
        .map((el) => el.textContent?.trim())
        .filter(Boolean);
      expect(names[0]).toBe('Jane Smith');
      expect(names[1]).toBe('Bob Johnson');
      expect(names[2]).toBe('John Doe');
    });
  });

  it('selects patient when clicked', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const patientRow = screen.getByText('John Doe').closest('div');
    fireEvent.click(patientRow!);

    expect(mockOnPatientSelect).toHaveBeenCalledWith('patient-1');
  });

  it('highlights selected patient', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={'patient-1'}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const selectedRow = screen.getByText('John Doe').closest('.cursor-pointer');
    expect(selectedRow?.className).toMatch(/bg-blue-50/);
  });

  it('shows pagination when there are many patients', () => {
    const manyPatients = Array.from({ length: 25 }, (_, i) => ({
      ...mockPatients[0],
      id: `patient-${i}`,
      firstName: `Patient${i}`,
      lastName: `Test${i}`
    }));

    render(
      <PatientRoster 
        patients={manyPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={[]}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 10 of 25 patients')).toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    const manyPatients = Array.from({ length: 25 }, (_, i) => ({
      ...mockPatients[0],
      id: `patient-${i}`,
      firstName: `Patient${i}`,
      lastName: `Test${i}`
    }));

    render(
      <PatientRoster 
        patients={manyPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={[]}
      />
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Showing 11 to 20 of 25 patients')).toBeInTheDocument();
    });
  });

  it('shows no patients message when filtered list is empty', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search patients...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentPatient' } });

    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  it('displays patient MRN and last updated date', () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    expect(
      screen.getAllByText((_, el) => Boolean(el?.textContent?.includes('MRN-001'))).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText((_, el) => Boolean(el?.textContent?.includes('Updated'))).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it('shows sort menu when sort button is clicked', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const sortButton = screen.getByRole('button', { name: /sort patient list/i });
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(screen.getByText('Name (Z-A)')).toBeInTheDocument();
      expect(screen.getAllByText('Enrollment Date').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Alert Count')).toBeInTheDocument();
    });
  });

  it('closes sort menu when option is selected', async () => {
    render(
      <PatientRoster 
        patients={mockPatients} 
        selectedPatientId={null}
        onPatientSelect={mockOnPatientSelect}
        alerts={mockAlerts}
      />
    );

    const sortButton = screen.getByRole('button', { name: /sort patient list/i });
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(screen.getByText('Name (Z-A)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Name (Z-A)'));

    await waitFor(() => {
      expect(screen.queryByText('Enrollment Date')).not.toBeInTheDocument();
    });
  });
});
