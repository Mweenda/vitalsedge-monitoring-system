/**
 * EnhancedProfileView Component Tests
 *
 * Comprehensive test coverage for clinician and patient profile pages.
 * Tests verify:
 *  - Role-specific content rendering
 *  - Name editing functionality
 *  - Error handling and validation
 *  - Accessibility features
 *  - Profile update persistence
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedProfileView } from './EnhancedProfileView';
import { CLINICIAN_FIXTURES, PATIENT_FIXTURES } from '../test/fixtures';

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('EnhancedProfileView - Clinician Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Clinician Profile', () => {
    it('should display clinician name and role badge', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.fullName)).toBeInTheDocument();
      expect(screen.getByText('CLINICIAN')).toBeInTheDocument();
    });

    it('should display clinician-specific fields', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.specialty!)).toBeInTheDocument();
      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.licenseNumber!)).toBeInTheDocument();
      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.clinicName!)).toBeInTheDocument();
    });

    it('should display data access scope for clinician', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(/assigned patients only/i)).toBeInTheDocument();
    });

    it('should show Professional Profile heading', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText('Professional Profile')).toBeInTheDocument();
    });

    it('should NOT display patient-specific fields', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      // Should not have MRN or Condition fields
      expect(screen.queryByText('MRN')).not.toBeInTheDocument();
      expect(screen.queryByText('Condition')).not.toBeInTheDocument();
    });
  });

  describe('Name Editing - Clinician', () => {
    it('should allow clicking edit button to enter edit mode', async () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      });
    });

    it('should validate name is not empty', async () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      const input = await screen.findByPlaceholderText('Enter your full name');
      fireEvent.change(input, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });
    });

    it('should validate name minimum length', async () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      const input = await screen.findByPlaceholderText('Enter your full name');
      fireEvent.change(input, { target: { value: 'A' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('should show success message after save', async () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      const input = await screen.findByPlaceholderText('Enter your full name');
      fireEvent.change(input, { target: { value: 'Dr. New Name' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('should cancel editing without changes', async () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      const input = await screen.findByPlaceholderText('Enter your full name');
      fireEvent.change(input, { target: { value: 'Different Name' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your full name')).not.toBeInTheDocument();
        expect(screen.getByText(CLINICIAN_FIXTURES.christopher.fullName)).toBeInTheDocument();
      });
    });
  });

  describe('Email Display', () => {
    it('should display email as read-only', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.email!)).toBeInTheDocument();
      // Email should be indicated as protected/read-only
      expect(screen.getByTitle('Email is managed by administrators')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
      const editButtons = screen.getAllByLabelText('Edit full name');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(container.querySelector('main') || container.querySelector('[role="main"]')).toBeTruthy();
    });
  });

  describe('HIPAA Compliance Notice', () => {
    it('should display HIPAA compliance notice', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(/HIPAA § 164.312/)).toBeInTheDocument();
      expect(screen.getByText(/encrypted at rest and in transit/)).toBeInTheDocument();
    });
  });

  describe('Back Navigation', () => {
    it('should call onBack when back button clicked', () => {
      const onBack = vi.fn();
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
          onBack={onBack}
        />
      );

      const backButton = screen.getByLabelText('Go back');
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator', () => {
      render(
        <EnhancedProfileView
          user={CLINICIAN_FIXTURES.christopher}
          loading={true}
        />
      );

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Null User', () => {
    it('should display error when user is null', () => {
      render(
        <EnhancedProfileView
          user={null}
          loading={false}
        />
      );

      expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      expect(screen.getByText('Please log in to view your profile')).toBeInTheDocument();
    });
  });
});

describe('EnhancedProfileView - Patient Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Patient Profile', () => {
    it('should display patient name and role badge', () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      expect(screen.getByText(PATIENT_FIXTURES.mweenda.fullName)).toBeInTheDocument();
      expect(screen.getByText('PATIENT')).toBeInTheDocument();
    });

    it('should display patient-specific fields', () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      expect(screen.getByText(PATIENT_FIXTURES.mweenda.mrn!)).toBeInTheDocument();
      expect(screen.getByText(PATIENT_FIXTURES.mweenda.condition!)).toBeInTheDocument();
      expect(screen.getByText(PATIENT_FIXTURES.mweenda.assignedClinicianName!)).toBeInTheDocument();
    });

    it('should show Health Profile heading', () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      expect(screen.getByText('Health Profile')).toBeInTheDocument();
    });

    it('should display patient data access scope', () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      expect(screen.getByText('What You Can See')).toBeInTheDocument();
      expect(screen.getByText(/your own vital signs and health data/i)).toBeInTheDocument();
    });

    it('should NOT display clinician-specific fields', () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      expect(screen.queryByText('Specialty')).not.toBeInTheDocument();
      expect(screen.queryByText('License')).not.toBeInTheDocument();
    });
  });

  describe('Patient Name Editing', () => {
    it('should allow patient to edit their name', async () => {
      render(
        <EnhancedProfileView
          user={PATIENT_FIXTURES.mweenda}
          loading={false}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit full name');
      fireEvent.click(editButtons[0]);

      const input = await screen.findByPlaceholderText('Enter your full name');
      fireEvent.change(input, { target: { value: 'Mweenda Lubia' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });
  });
});
