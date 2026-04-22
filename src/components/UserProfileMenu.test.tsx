/**
 * UserProfileMenu Test Specification (TDD)
 * 
 * Comprehensive test cases verifying all hamburger dropdown features
 * for the user "Christopher Kawanga" (CLINICIAN) and "Mweenda Lubi" (PATIENT).
 * Tests ensure clear distinction between clinician and patient roles.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProfileMenu } from './UserProfileMenu';
import { CLINICIAN_FIXTURES, PATIENT_FIXTURES } from '../test/fixtures';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: CLINICIAN_FIXTURES.christopher.uid,
      email: CLINICIAN_FIXTURES.christopher.email,
      displayName: CLINICIAN_FIXTURES.christopher.fullName,
      emailVerified: true,
      metadata: {
        creationTime: CLINICIAN_FIXTURES.christopher.createdAt,
        lastSignInTime: new Date().toISOString(),
      },
    },
  },
  signOut: vi.fn().mockResolvedValue(undefined),
}));

describe('UserProfileMenu - Avatar Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Avatar Button Renders With Correct Initials (Clinician)
  it('FEATURE: Avatar displays user initials (CK for Christopher Kawanga - CLINICIAN)', () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    const avatar = screen.getByText('CK');
    expect(avatar).toBeInTheDocument();
  });

  // Test Case 1b: Avatar Button Renders With Correct Initials (Patient)
  it('FEATURE: Avatar displays user initials (ML for Mweenda Lubi - PATIENT)', () => {
    render(
      <UserProfileMenu
        fullName={PATIENT_FIXTURES.mweenda.fullName}
        role={PATIENT_FIXTURES.mweenda.role}
        email={PATIENT_FIXTURES.mweenda.email}
      />
    );
    const avatar = screen.getByText('ML');
    expect(avatar).toBeInTheDocument();
  });

  // Test Case 2: Avatar Has Correct Role Color (Emerald for CLINICIAN)
  it('FEATURE: Avatar background color is emerald for CLINICIAN role', () => {
    const { container } = render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    const avatar = screen.getByText('CK').parentElement;
    expect(avatar).toHaveClass('bg-emerald-600');
  });

  // Test Case 2b: Avatar Has Correct Role Color (Blue for PATIENT)
  it('FEATURE: Avatar background color is blue for PATIENT role', () => {
    const { container } = render(
      <UserProfileMenu
        fullName={PATIENT_FIXTURES.mweenda.fullName}
        role={PATIENT_FIXTURES.mweenda.role}
        email={PATIENT_FIXTURES.mweenda.email}
      />
    );
    const avatar = screen.getByText('ML').parentElement;
    expect(avatar).toHaveClass('bg-blue-600');
  });
});

describe('UserProfileMenu - Dropdown Interactions', () => {
  // Test Case 3: Hamburger Toggle Opens Dropdown
  it('FEATURE: Clicking avatar opens hamburger dropdown menu', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    const button = screen.getByLabelText('Open user menu');
    expect(button).toBeInTheDocument();
    
    // Dropdown should not be visible initially
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    
    // Click avatar to open
    fireEvent.click(button);
    
    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
  });

  // Test Case 10: Dropdown Closes On Outside Click
  it('FEATURE: Dropdown closes when clicking outside', async () => {
    const { container } = render(
      <div>
        <UserProfileMenu
          fullName={CLINICIAN_FIXTURES.christopher.fullName}
          role={CLINICIAN_FIXTURES.christopher.role}
          email={CLINICIAN_FIXTURES.christopher.email}
        />
        <div data-testid="outside">Outside content</div>
      </div>
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });
  });

  // Test Case 11: Dropdown Closes On Escape Key
  it('FEATURE: Dropdown closes when pressing Escape key', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
    
    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });
  });
});

describe('UserProfileMenu - Menu Content (Clinician Role)', () => {
  // Test Case 4: Dropdown Shows Identity Card With User Info
  it('FEATURE: Dropdown displays identity card with name, email, and role (Clinician)', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.fullName)).toBeInTheDocument();
      expect(screen.getByText(CLINICIAN_FIXTURES.christopher.email!)).toBeInTheDocument();
      expect(screen.getByText('Clinician')).toBeInTheDocument();
    });
  });

  // Test Case 4b: Dropdown Shows Identity Card With User Info (Patient)
  it('FEATURE: Dropdown displays identity card with name, email, and role (Patient)', async () => {
    render(
      <UserProfileMenu
        fullName={PATIENT_FIXTURES.mweenda.fullName}
        role={PATIENT_FIXTURES.mweenda.role}
        email={PATIENT_FIXTURES.mweenda.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText(PATIENT_FIXTURES.mweenda.fullName)).toBeInTheDocument();
      expect(screen.getByText(PATIENT_FIXTURES.mweenda.email!)).toBeInTheDocument();
      expect(screen.getByText('Patient')).toBeInTheDocument();
    });
  });

  // Test Case 5: Dropdown Shows Data Access Scope
  it('FEATURE: Dropdown displays data-access scope label (Patient-scoped for CLINICIAN)', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText(/Patient-scoped/)).toBeInTheDocument();
      expect(screen.getByText(/Assigned patients · Vitals · Alerts · Device config/)).toBeInTheDocument();
    });
  });

  // Test Case 6: "My Profile" Link Navigation
  it('FEATURE: Clicking "My Profile" calls onNavigate callback with "profile"', async () => {
    const onNavigate = vi.fn();
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
        onNavigate={onNavigate}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      const profileButton = screen.getByText('My Profile');
      fireEvent.click(profileButton);
    });
    
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });

  // Test Case 7: "Settings" Link Navigation
  it('FEATURE: Clicking "Settings" calls onNavigate callback with "settings"', async () => {
    const onNavigate = vi.fn();
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
        onNavigate={onNavigate}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);
    });
    
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  // Test Case 8: Sign Out Button Visible
  it('FEATURE: "Sign out" button is visible in dropdown', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  // Test Case 13: Role Badge Shows Correct Label
  it('FEATURE: Role badge displays "Clinician" label for CLINICIAN role', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    // Check both avatar trigger
    expect(screen.getAllByText('Clinician').length).toBeGreaterThanOrEqual(1);
  });

  // Test Case 14: HIPAA Compliance Notice Present
  it('FEATURE: Dropdown includes HIPAA compliance notice in footer', async () => {
    render(
      <UserProfileMenu
        fullName={CLINICIAN_FIXTURES.christopher.fullName}
        role={CLINICIAN_FIXTURES.christopher.role}
        email={CLINICIAN_FIXTURES.christopher.email}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Open user menu'));
    
    await waitFor(() => {
      expect(screen.getByText(/Session data is scoped to your role/)).toBeInTheDocument();
      expect(screen.getByText(/HIPAA/)).toBeInTheDocument();
    });
  });
});
