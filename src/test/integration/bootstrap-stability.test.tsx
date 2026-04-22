import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseProvider, useFirebase } from '../../components/FirebaseProvider';
import { FormField } from '../../components/common/FormField';

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(() => ({})),
}));

vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: mocks.onAuthStateChanged,
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
}));

function Consumer() {
  const { user, userData, loading, degraded, error } = useFirebase();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="degraded">{String(degraded)}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="user">{user?.email ?? 'none'}</div>
      <div data-testid="role">{userData?.role ?? 'none'}</div>
    </div>
  );
}

function renderWithProvider(
  component: React.ReactNode,
  bootstrapTimeoutMs?: number,
) {
  return render(
    <FirebaseProvider bootstrapTimeoutMs={bootstrapTimeoutMs}>
      {component}
    </FirebaseProvider>,
  );
}

describe('Bootstrap stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('resolves to an unauthenticated state without hanging', async () => {
    mocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return vi.fn();
    });

    renderWithProvider(<Consumer />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('degraded')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
  });

  it('falls back to degraded mode when Firestore hydration fails', async () => {
    mocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({
        uid: 'user-1',
        email: 'clinician@example.com',
        displayName: 'Clinician Example',
      });
      return vi.fn();
    });
    mocks.getDoc.mockRejectedValue(new Error('firestore down'));

    renderWithProvider(<Consumer />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('degraded')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('clinician@example.com');
      expect(screen.getByTestId('role')).toHaveTextContent('CLINICIAN');
    });
  });

  it('enters degraded mode when hydration exceeds the timeout budget', async () => {
    mocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({
        uid: 'user-2',
        email: 'timeout@example.com',
        displayName: 'Timeout User',
      });
      return vi.fn();
    });
    mocks.getDoc.mockImplementation(() => new Promise(() => {}));

    renderWithProvider(<Consumer />, 25);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('degraded')).toHaveTextContent('true');
      expect(screen.getByTestId('error')).toHaveTextContent('timeout');
    });
  });
});

describe('FormField contract', () => {
  it('renders a required name attribute for autofill and accessibility hooks', () => {
    render(
      <FormField
        id="test-email"
        name="email"
        label="Email"
        type="email"
        value=""
        autoComplete="email"
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
  });
});
