import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user', email: 'test@example.com' } },
  handleFirestoreError: vi.fn(),
  OperationType: {
    LIST: 'list',
    GET: 'get',
    UPDATE: 'update',
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return vi.fn();
  }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
}));

vi.mock('./FirebaseProvider', () => ({
  useFirebase: () => ({
    userData: { role: 'ADMIN', fullName: 'Test User' },
  }),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Clinician')).toBeInTheDocument();
    expect(screen.getByText('Remote Monitoring Portal')).toBeInTheDocument();
  });

  it('displays navigation tabs', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
    expect(screen.getByText('Device Config')).toBeInTheDocument();
  });

  it('shows admin-only tabs for admin users', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Clinician Management')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
  });

  it('displays patient search input', () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('SEARCH PATIENTS...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows export data button', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });
});
