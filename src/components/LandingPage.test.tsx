import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage from './LandingPage';
import { FirebaseProvider } from './FirebaseProvider';

vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {},
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: null) => void) => {
    callback(null);
    return () => {};
  }),
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'GET', LIST: 'LIST', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
  GoogleAuthProvider: vi.fn(),
}));

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the landing page hero section', async () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    expect(screen.getAllByText(/VitalsEdge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI-Powered/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Patient Monitoring/i)).toBeInTheDocument();
  });

  it('displays key features', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    expect(screen.getByText(/Real-time Monitoring/i)).toBeInTheDocument();
    expect(screen.getAllByText(/HIPAA Compliant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Advanced Analytics/i).length).toBeGreaterThan(0);
  });

  it('calls onLogin and onGetStarted when buttons are clicked', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    const startButtons = screen.getAllByRole('button', { name: /Start Monitoring|Get Started/i });
    const signInButtons = screen.getAllByRole('button', { name: /Sign In/i });
    
    fireEvent.click(startButtons[0]);
    expect(onGetStarted).toHaveBeenCalled();
    
    fireEvent.click(signInButtons[0]);
    expect(onLogin).toHaveBeenCalled();
  });

  it('displays testimonials', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    expect(screen.getByText(/Trusted by Healthcare Professionals/i)).toBeInTheDocument();
    expect(screen.getByText(/Christopher Kawanga/i)).toBeInTheDocument();
    expect(screen.getByText(/Mweenda Lubi/i)).toBeInTheDocument();
  });

  it('renders the hero image with zap overlay', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    const dashboardImg = screen.getByAltText(/Dashboard Preview/i);
    expect(dashboardImg).toBeInTheDocument();
    expect(dashboardImg).toHaveAttribute('src', 'https://picsum.photos/seed/dashboard/1920/1080');
  });

  it('displays security information', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    expect(screen.getByText(/Enterprise-Grade Security/i)).toBeInTheDocument();
    expect(screen.getByText(/End-to-End Encryption/i)).toBeInTheDocument();
  });

  it('displays footer links', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onLogin={onLogin} />);
    
    expect(screen.getByText(/Privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Compliance/i).length).toBeGreaterThan(0);
  });
});
