import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordReset } from './PasswordReset';
import { sendPasswordResetEmail } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: vi.fn(),
  auth: {},
}));

vi.mock('../firebase', () => ({
  auth: {},
}));

describe('PasswordReset Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the password reset form', () => {
    render(<PasswordReset onBack={mockOnBack} />);
    
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(<PasswordReset onBack={mockOnBack} />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    const emailInput = screen.getByLabelText(/^email$/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeInvalid();
    });
  });

  it('shows validation error for invalid email format', async () => {
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeInvalid();
    });
  });

  it('calls sendPasswordResetEmail with valid email', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({}, 'test@example.com');
    });
  });

  it('shows success message after successful password reset', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });
  });

  it('shows error message for user not found', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockRejectedValue({ code: 'auth/user-not-found' });
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/No account found with this email address/i)).toBeInTheDocument();
    });
  });

  it('shows error message for invalid email', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockRejectedValue({ code: 'auth/invalid-email' });

    render(<PasswordReset onBack={mockOnBack} />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'bad@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows error message for too many requests', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockRejectedValue({ code: 'auth/too-many-requests' });
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message for unknown errors', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockRejectedValue({ code: 'unknown-error' });
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to send password reset email/i)).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', () => {
    render(<PasswordReset onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('calls onBack when back to login button is clicked after success', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    });

    const backToLoginButton = screen.getByRole('button', { name: /back to sign in/i });
    fireEvent.click(backToLoginButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('disables submit button and shows loading state during submission', async () => {
    const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
    let resolvePromise: (value: void) => void;
    mockSendPasswordResetEmail.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));
    
    render(<PasswordReset onBack={mockOnBack} />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Sending…')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    resolvePromise!();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    });
  });
});
