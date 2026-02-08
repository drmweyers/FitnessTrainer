/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-users" />,
  UserPlus: () => <span data-testid="icon-user-plus" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Award: () => <span data-testid="icon-award" />,
  Activity: () => <span data-testid="icon-activity" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  Clock: () => <span data-testid="icon-clock" />,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the clientConnectionService
const mockGetTrainerClients = jest.fn().mockResolvedValue({
  clients: [
    { id: 'c1', status: 'active', name: 'Client One' },
    { id: 'c2', status: 'active', name: 'Client Two' },
    { id: 'c3', status: 'pending', name: 'Client Three' },
  ],
});
const mockInviteClient = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/services/clientConnectionService', () => ({
  clientConnectionService: {
    getTrainerClients: (...args: any[]) => mockGetTrainerClients(...args),
    inviteClient: (...args: any[]) => mockInviteClient(...args),
  },
  InviteClientData: {},
}));

// Mock shared components
jest.mock('@/components/shared/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children, title, subtitle, actions }: any) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actions && <div data-testid="actions">{actions}</div>}
      {children}
    </div>
  ),
}));

jest.mock('@/components/features/ClientManagement/ClientConnectionList', () => ({
  __esModule: true,
  default: ({ onInviteClient }: any) => (
    <div data-testid="client-connection-list">
      <button onClick={onInviteClient}>Invite from list</button>
    </div>
  ),
}));

jest.mock('@/components/features/ClientManagement/InviteClientModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onInvite }: any) =>
    isOpen ? (
      <div data-testid="invite-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onInvite('test@example.com', 'Hello')}>Send Invite</button>
      </div>
    ) : null,
}));

jest.mock('@/components/shared/StatCard', () => ({
  __esModule: true,
  default: ({ title, value, subtitle, color, id }: any) => (
    <div data-testid={`stat-card-${id}`}>
      <span>{title}</span>
      <span>{String(value)}</span>
      {subtitle && <span>{subtitle}</span>}
    </div>
  ),
}));

jest.mock('@/components/shared/ActivityFeed', () => ({
  __esModule: true,
  default: ({ activities, emptyMessage }: any) => (
    <div data-testid="activity-feed">
      {activities.length === 0 ? emptyMessage : activities.map((a: any) => <div key={a.id}>{a.title}</div>)}
    </div>
  ),
}));

jest.mock('@/components/shared/QuickActions', () => ({
  __esModule: true,
  default: ({ actions, title }: any) => (
    <div data-testid="quick-actions">
      <h3>{title}</h3>
      {actions.map((a: any) => <div key={a.id}>{a.title}</div>)}
    </div>
  ),
}));

import EnhancedTrainerDashboard from '../EnhancedTrainerDashboard';

describe('EnhancedTrainerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    // Make the service never resolve
    mockGetTrainerClients.mockReturnValueOnce(new Promise(() => {}));
    render(<EnhancedTrainerDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should render dashboard title after loading', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
  });

  it('should call getTrainerClients on mount', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(mockGetTrainerClients).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  it('should display stat cards with correct values', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('stat-card-total-clients')).toHaveTextContent('Total Clients');
      expect(screen.getByTestId('stat-card-total-clients')).toHaveTextContent('3');
      expect(screen.getByTestId('stat-card-active-clients')).toHaveTextContent('Active Clients');
      expect(screen.getByTestId('stat-card-active-clients')).toHaveTextContent('2');
      expect(screen.getByTestId('stat-card-pending-clients')).toHaveTextContent('Pending Invitations');
      expect(screen.getByTestId('stat-card-pending-clients')).toHaveTextContent('1');
    });
  });

  it('should render ClientConnectionList', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('client-connection-list')).toBeInTheDocument();
    });
  });

  it('should render QuickActions', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render ActivityFeed', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  it('should render performance metrics', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("This Month's Performance")).toBeInTheDocument();
    });
  });

  it('should open invite modal when Invite Client button is clicked', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });

    // Find the "Invite Client" button in the header actions area
    const inviteButtons = screen.getAllByText('Invite Client');
    // The first one is in the header actions
    fireEvent.click(inviteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    });
  });

  it('should close invite modal', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });

    // Open modal
    const inviteButtons = screen.getAllByText('Invite Client');
    fireEvent.click(inviteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));

    await waitFor(() => {
      expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
    });
  });

  it('should handle invite and refresh dashboard data', async () => {
    render(<EnhancedTrainerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });

    // Open modal
    const inviteButtons = screen.getAllByText('Invite Client');
    fireEvent.click(inviteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    });

    // Send invite
    fireEvent.click(screen.getByText('Send Invite'));

    await waitFor(() => {
      expect(mockInviteClient).toHaveBeenCalled();
      // Should refresh data - getTrainerClients called again
      expect(mockGetTrainerClients).toHaveBeenCalledTimes(2);
    });
  });
});
