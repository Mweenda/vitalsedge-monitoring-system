import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EdgeDevice } from './EdgeDevice';
import { FirebaseProvider } from './FirebaseProvider';

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-user', email: 'test@example.com' } },
  db: {},
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    callback({ uid: 'test-user', email: 'test@example.com' });
    return () => {};
  }),
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'GET', LIST: 'LIST', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}));

vi.mock('../utils/vitalsValidation', () => ({
  validateVitals: vi.fn(() => ({ isValid: true, anomalies: [] })),
}));

describe('EdgeDevice Component', () => {
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

  it('renders the edge device interface', () => {
    renderWithProvider(<EdgeDevice />);
    
    expect(screen.getByText(/Edge Node v2.1/i)).toBeInTheDocument();
    expect(screen.getByText(/Heart Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Blood Pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/Oxygen Saturation/i)).toBeInTheDocument();
  });

  it('displays current vitals readings', () => {
    renderWithProvider(<EdgeDevice />);
    
    expect(screen.getByTestId('heart-rate')).toBeInTheDocument();
    expect(screen.getByTestId('blood-pressure')).toBeInTheDocument();
    expect(screen.getByTestId('oxygen-saturation')).toBeInTheDocument();
    expect(screen.getByTestId('temperature')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    renderWithProvider(<EdgeDevice />);
    
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
  });

  it('allows manual vitals input', async () => {
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Heart Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Systolic BP/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Diastolic BP/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Oxygen Saturation/i)).toBeInTheDocument();
    });
  });

  it('validates vitals input ranges', async () => {
    const { validateVitals } = await import('../utils/vitalsValidation');
    vi.mocked(validateVitals).mockReturnValue({
      isValid: false,
      anomalies: ['Heart rate too high'],
    });
    
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      fireEvent.change(heartRateInput, { target: { value: '200' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Heart rate too high/i)).toBeInTheDocument();
    });
  });

  it('saves vitals to database', async () => {
    const { addDoc } = await import('firebase/firestore');
    const mockAddDoc = vi.mocked(addDoc);
    mockAddDoc.mockResolvedValue({ id: 'vitals-123' });
    
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      const systolicInput = screen.getByLabelText(/Systolic BP/i);
      const diastolicInput = screen.getByLabelText(/Diastolic BP/i);
      const oxygenInput = screen.getByLabelText(/Oxygen Saturation/i);
      
      fireEvent.change(heartRateInput, { target: { value: '75' } });
      fireEvent.change(systolicInput, { target: { value: '120' } });
      fireEvent.change(diastolicInput, { target: { value: '80' } });
      fireEvent.change(oxygenInput, { target: { value: '98' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          patientId: 'patient-123',
          heartRate: 75,
          bloodPressure: { systolic: 120, diastolic: 80 },
          oxygenSaturation: 98,
          timestamp: expect.any(Object),
        })
      );
    });
  });

  it('shows success message after saving vitals', async () => {
    const { addDoc } = await import('firebase/firestore');
    vi.mocked(addDoc).mockResolvedValue({ id: 'vitals-123' });
    
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      fireEvent.change(heartRateInput, { target: { value: '75' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Vitals saved successfully/i)).toBeInTheDocument();
    });
  });

  it('handles errors when saving vitals', async () => {
    const { addDoc } = await import('firebase/firestore');
    vi.mocked(addDoc).mockRejectedValue(new Error('Database error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      fireEvent.change(heartRateInput, { target: { value: '75' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to save vitals/i)).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error saving vitals:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('displays real-time updates', async () => {
    const { onSnapshot } = await import('firebase/firestore');
    const mockOnSnapshot = vi.mocked(onSnapshot);
    
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
    
    renderWithProvider(<EdgeDevice />);
    
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('cleans up subscription on unmount', async () => {
    const { onSnapshot } = await import('firebase/firestore');
    const mockOnSnapshot = vi.mocked(onSnapshot);
    
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
    
    const { unmount } = renderWithProvider(<EdgeDevice />);
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('shows anomaly alerts when detected', async () => {
    const { validateVitals } = await import('../utils/vitalsValidation');
    vi.mocked(validateVitals).mockReturnValue({
      isValid: false,
      anomalies: ['Heart rate too high', 'Blood pressure elevated'],
    });
    
    renderWithProvider(<EdgeDevice />);
    
    const manualInputButton = screen.getByRole('button', { name: /Manual Input/i });
    fireEvent.click(manualInputButton);
    
    await waitFor(() => {
      const heartRateInput = screen.getByLabelText(/Heart Rate/i);
      fireEvent.change(heartRateInput, { target: { value: '150' } });
    });
    
    const submitButton = screen.getByRole('button', { name: /Submit Vitals/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Anomaly Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Heart rate too high/i)).toBeInTheDocument();
      expect(screen.getByText(/Blood pressure elevated/i)).toBeInTheDocument();
    });
  });

  it('allows starting and stopping continuous monitoring', () => {
    renderWithProvider(<EdgeDevice />);
    
    const startButton = screen.getByRole('button', { name: /Start Monitoring/i });
    expect(startButton).toBeInTheDocument();
    
    fireEvent.click(startButton);
    
    expect(screen.getByRole('button', { name: /Stop Monitoring/i })).toBeInTheDocument();
  });

  it('displays device battery level', () => {
    renderWithProvider(<EdgeDevice />);
    
    expect(screen.getByText(/Battery:/i)).toBeInTheDocument();
    expect(screen.getByTestId('battery-level')).toBeInTheDocument();
  });

  it('shows last sync time', () => {
    renderWithProvider(<EdgeDevice />);
    
    expect(screen.getByText(/Last Sync:/i)).toBeInTheDocument();
  });
});
