import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from './Login';
import { signInWithPopup } from 'firebase/auth';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />);
    
    expect(screen.getByText('VitalsEdge')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to the remote monitoring portal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('shows error when terms are not accepted', async () => {
    render(<Login />);
    
    const loginButton = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please accept the Terms of Service/i)).toBeInTheDocument();
    });
  });

  it('enables login button when terms are accepted', () => {
    render(<Login />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('calls signInWithPopup when login is clicked with terms accepted', async () => {
    const mockSignIn = vi.mocked(signInWithPopup);
    mockSignIn.mockResolvedValue({} as any);
    
    render(<Login />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    const loginButton = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('shows password reset link', () => {
    render(<Login />);
    
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
  });

  it('displays error message on login failure', async () => {
    const mockSignIn = vi.mocked(signInWithPopup);
    mockSignIn.mockRejectedValue({ code: 'auth/popup-blocked' });
    
    render(<Login />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/popup was blocked/i)).toBeInTheDocument();
    });
  });
});
