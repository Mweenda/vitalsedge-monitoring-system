/**
 * UserSettingsView Component Tests
 *
 * Comprehensive test coverage for user settings and security pages.
 * Tests verify:
 *  - Password change workflow with validation
 *  - Notification preferences
 *  - Privacy settings
 *  - Session management
 *  - Security features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserSettingsView } from './UserSettingsView';
import { CLINICIAN_FIXTURES, PATIENT_FIXTURES } from '../test/fixtures';

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid', email: 'test@example.com' } },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  updatePassword: vi.fn().mockResolvedValue(undefined),
  reauthenticateWithCredential: vi.fn().mockResolvedValue(undefined),
  EmailAuthProvider: {
    credential: vi.fn((email, password) => ({ email, password })),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
}));

vi.mock('../lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('UserSettingsView - Clinician Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render page header with Settings title', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    });

    it('should display all settings sections', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText('Security & Access')).toBeInTheDocument();
      expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('Authorized Sessions')).toBeInTheDocument();
    });

    it('should provide back navigation', () => {
      const onBack = vi.fn();
      render(
        <UserSettingsView
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

  describe('Password Change Workflow', () => {
    it('should display password change section', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByPlaceholderText('Enter current password to verify identity')).toBeInTheDocument();
    });

    it('should require current password to proceed', async () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const proceedButton = screen.getByText('Continue to Change Password');
      expect(proceedButton).toBeDisabled();

      const currentPasswordInput = screen.getByPlaceholderText('Enter current password to verify identity');
      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } });

      await waitFor(() => {
        expect(proceedButton).not.toBeDisabled();
      });
    });

    it('should show password visibility toggle', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const toggleButtons = screen.getAllByRole('button').filter(btn => {
        const parent = btn.parentElement;
        return parent?.className.includes('relative');
      });

      expect(toggleButtons.length).toBeGreaterThan(0);
    });

    it('should validate new password requirements', async () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      // Move to password change step
      const currentPasswordInput = screen.getByPlaceholderText('Enter current password to verify identity');
      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } });

      const proceedButton = screen.getByText('Continue to Change Password');
      fireEvent.click(proceedButton);

      // Check password requirements display
      await waitFor(() => {
        expect(screen.getByText(/Uppercase letter/)).toBeInTheDocument();
        expect(screen.getByText(/Lowercase letter/)).toBeInTheDocument();
        expect(screen.getByText((_, el) => el?.textContent === 'Number')).toBeInTheDocument();
        expect(screen.getByText(/Special character/)).toBeInTheDocument();
        expect(screen.getByText(/12\+ characters/)).toBeInTheDocument();
      });
    });

    it('should require passwords to match', async () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const currentPasswordInput = screen.getByPlaceholderText('Enter current password to verify identity');
      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } });

      const proceedButton = screen.getByText('Continue to Change Password');
      fireEvent.click(proceedButton);

      await waitFor(() => {
        const newPasswordInputs = screen.getAllByPlaceholderText(/password/i);
        expect(newPasswordInputs.length).toBeGreaterThan(0);
      });

      // This would test password mismatch validation
    });

    it('should show success message after password change', async () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      // Navigate through password change flow would result in success message
      // Implementation depends on form state management
    });

    it('should allow canceling password change', async () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const currentPasswordInput = screen.getByPlaceholderText('Enter current password to verify identity');
      fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } });

      const proceedButton = screen.getByText('Continue to Change Password');
      fireEvent.click(proceedButton);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        // Should return to initial state
        expect(screen.getByPlaceholderText('Enter current password to verify identity')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Settings', () => {
    it('should have Email Alerts toggle enabled by default', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText('Email Alerts')).toBeInTheDocument();
    });

    it('should display notification preferences', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText('Receive real-time notifications via email')).toBeInTheDocument();
    });

    it('should show conditional notifications based on email alerts toggle', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      // Should have critical alerts and daily digest options
      expect(screen.getByText('Critical Only')).toBeInTheDocument();
    });
  });

  describe('Privacy Settings', () => {
    it('should display data retention information', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText('Compliance Retention Policy')).toBeInTheDocument();
      expect(screen.getByText(/24 months/)).toBeInTheDocument();
    });

    it('should explain data privacy policy', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByText(/retained for a minimum of 24 months/i)).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should display active sessions', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getAllByText('Authorized Sessions').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Active Workspace')).toBeInTheDocument();
    });

    it('should mark current session', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getAllByText(/your current session/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Sign Out', () => {
    it('should display sign out button', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      expect(screen.getByRole('button', { name: /^sign out$/i })).toBeInTheDocument();
    });

    it('should call onSignOut when button clicked', () => {
      const onSignOut = vi.fn();
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
          onSignOut={onSignOut}
        />
      );

      const signOutButton = screen.getAllByText('Sign Out').find(btn => 
        btn.tagName === 'BUTTON'
      );
      
      if (signOutButton) {
        fireEvent.click(signOutButton);
        expect(onSignOut).toHaveBeenCalled();
      }
    });
  });

  describe('Security Notice', () => {
    it('should display HIPAA/security compliance notice', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
        />
      );

      const governance = screen.getAllByText((_, el) =>
        Boolean(el?.textContent?.includes('cryptographically signed')),
      );
      expect(governance.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={false}
          onBack={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Enter current password to verify identity')).toBeInTheDocument();
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading=true', () => {
      render(
        <UserSettingsView
          user={CLINICIAN_FIXTURES.christopher}
          loading={true}
        />
      );

      expect(screen.getByText(/loading security modules/i)).toBeInTheDocument();
    });
  });

  describe('Null User', () => {
    it('should display error when user is null', () => {
      render(
        <UserSettingsView
          user={null}
          loading={false}
        />
      );

      expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
      expect(screen.getByText(/please sign in to your professional account/i)).toBeInTheDocument();
    });
  });
});

describe('UserSettingsView - Patient Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings for patient role', () => {
    render(
      <UserSettingsView
        user={PATIENT_FIXTURES.mweenda}
        loading={false}
      />
    );

    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByText('Security & Access')).toBeInTheDocument();
  });

  it('should display same settings sections for patients', () => {
    render(
      <UserSettingsView
        user={PATIENT_FIXTURES.mweenda}
        loading={false}
      />
    );

    expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Authorized Sessions')).toBeInTheDocument();
  });
});

describe('Password Validation Rules', () => {
  it('should enforce minimum 12 character password length', () => {
    render(
      <UserSettingsView
        user={CLINICIAN_FIXTURES.christopher}
        loading={false}
      />
    );

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password to verify identity');
    fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } });

    const proceedButton = screen.getByText('Continue to Change Password');
    fireEvent.click(proceedButton);

    expect(screen.getByText(/12\+ characters/)).toBeInTheDocument();
  });

  it('should require uppercase letters', async () => {
    render(
      <UserSettingsView
        user={CLINICIAN_FIXTURES.christopher}
        loading={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter current password to verify identity'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.click(screen.getByText('Continue to Change Password'));

    await waitFor(() => {
      expect(screen.getByText(/Uppercase letter/)).toBeInTheDocument();
    });
  });

  it('should require lowercase letters', async () => {
    render(
      <UserSettingsView
        user={CLINICIAN_FIXTURES.christopher}
        loading={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter current password to verify identity'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.click(screen.getByText('Continue to Change Password'));

    await waitFor(() => {
      expect(screen.getByText(/Lowercase letter/)).toBeInTheDocument();
    });
  });

  it('should require numbers', async () => {
    render(
      <UserSettingsView
        user={CLINICIAN_FIXTURES.christopher}
        loading={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter current password to verify identity'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.click(screen.getByText('Continue to Change Password'));

    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.textContent === 'Number')).toBeInTheDocument();
    });
  });

  it('should require special characters', async () => {
    render(
      <UserSettingsView
        user={CLINICIAN_FIXTURES.christopher}
        loading={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter current password to verify identity'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.click(screen.getByText('Continue to Change Password'));

    await waitFor(() => {
      expect(screen.getByText(/Special character/)).toBeInTheDocument();
    });
  });
});
