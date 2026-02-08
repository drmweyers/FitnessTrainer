/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedClientDashboard from '../EnhancedClientDashboard';

// Mock useAuth
const mockUser = { id: 'user-1', email: 'client@example.com', name: 'Test Client', role: 'client' };
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock DashboardLayout
jest.mock('@/components/shared/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }: any) => (
    <div data-testid="dashboard-layout" data-title={title} data-subtitle={subtitle}>
      {children}
    </div>
  ),
}));

// Mock InvitationNotifications
jest.mock('@/components/features/ClientManagement/InvitationNotifications', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="invitation-notifications" data-email={props.clientEmail}>
      Notifications
    </div>
  ),
}));

// Mock StatCard
jest.mock('@/components/shared/StatCard', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid={`stat-card-${props.id}`}>
      <span>{props.title}</span>
      <span>{props.value}</span>
    </div>
  ),
}));

// Mock ActivityFeed
jest.mock('@/components/shared/ActivityFeed', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="activity-feed">
      Activity Feed ({props.activities?.length || 0} activities)
    </div>
  ),
}));

// Mock QuickActions
jest.mock('@/components/shared/QuickActions', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="quick-actions">
      {props.actions?.map((a: any) => (
        <span key={a.id}>{a.title}</span>
      ))}
    </div>
  ),
}));

// Mock clientConnectionService
const mockGetClientTrainer = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockDeclineInvitation = jest.fn();
const mockDisconnectTrainer = jest.fn();

jest.mock('@/services/clientConnectionService', () => ({
  clientConnectionService: {
    getClientTrainer: () => mockGetClientTrainer(),
    acceptInvitation: (token: string) => mockAcceptInvitation(token),
    declineInvitation: (id: string) => mockDeclineInvitation(id),
    disconnectTrainer: () => mockDisconnectTrainer(),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  UserCheck: (props: any) => <span data-testid="icon-usercheck" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  TrendingUp: (props: any) => <span data-testid="icon-trending" {...props} />,
  Award: (props: any) => <span data-testid="icon-award" {...props} />,
  Activity: (props: any) => <span data-testid="icon-activity" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Target: (props: any) => <span data-testid="icon-target" {...props} />,
  Dumbbell: (props: any) => <span data-testid="icon-dumbbell" {...props} />,
  MessageCircle: (props: any) => <span data-testid="icon-message" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  Mail: (props: any) => <span data-testid="icon-mail" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

describe('EnhancedClientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockGetClientTrainer.mockReturnValue(new Promise(() => {})); // never resolves
      const { container } = render(<EnhancedClientDashboard />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  describe('Without Trainer (No Connection)', () => {
    beforeEach(() => {
      mockGetClientTrainer.mockRejectedValue(new Error('No trainer'));
    });

    it('renders dashboard layout with correct title', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const layout = screen.getByTestId('dashboard-layout');
        expect(layout).toHaveAttribute('data-title', 'Client Dashboard');
      });
    });

    it('shows "Connect with a Personal Trainer" prompt', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Connect with a Personal Trainer')).toBeInTheDocument();
      });
    });

    it('shows Find Trainers button', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        // "Find Trainers" appears in the CTA section and in quick actions
        expect(screen.getAllByText('Find Trainers').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders stat cards', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('stat-card-completed-workouts')).toBeInTheDocument();
        expect(screen.getByTestId('stat-card-current-streak')).toBeInTheDocument();
        expect(screen.getByTestId('stat-card-program-progress')).toBeInTheDocument();
        expect(screen.getByTestId('stat-card-achieved-goals')).toBeInTheDocument();
      });
    });

    it('renders quick actions for no-trainer state', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Browse Exercises')).toBeInTheDocument();
        expect(screen.getByText('Set Goals')).toBeInTheDocument();
        // "Find Trainers" appears both in the prompt and quick actions
        expect(screen.getAllByText('Find Trainers').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Track Progress')).toBeInTheDocument();
      });
    });

    it('renders activity feed', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
      });
    });

    it('renders weekly progress overview', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText("This Week's Progress")).toBeInTheDocument();
        expect(screen.getByText('4/5')).toBeInTheDocument();
        expect(screen.getByText('5.2h')).toBeInTheDocument();
        expect(screen.getByText('+2.1%')).toBeInTheDocument();
      });
    });

    it('renders invitation notifications', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const notifications = screen.getByTestId('invitation-notifications');
        expect(notifications).toBeInTheDocument();
        expect(notifications).toHaveAttribute('data-email', 'client@example.com');
      });
    });
  });

  describe('With Trainer Connection', () => {
    const mockConnection = {
      id: 'conn-1',
      status: 'active',
      connectedAt: '2024-01-01T00:00:00Z',
      trainer: {
        id: 'trainer-1',
        email: 'trainer@example.com',
        role: 'trainer' as const,
        userProfile: {
          id: 'up-1',
          userId: 'trainer-1',
          bio: 'Coach Mike',
          preferredUnits: 'metric' as const,
          isPublic: true,
          createdAt: '2024-01-01',
        },
        trainerCertifications: [
          {
            id: 'cert-1',
            certificationName: 'NASM CPT',
            issuingOrganization: 'NASM',
            isVerified: true,
            createdAt: '2024-01-01',
          },
        ],
        trainerSpecializations: [
          {
            id: 'spec-1',
            specialization: 'Weight Loss',
          },
        ],
      },
    };

    beforeEach(() => {
      mockGetClientTrainer.mockResolvedValue(mockConnection);
    });

    it('shows trainer connection info', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Coach Mike')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('shows trainer email', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('trainer@example.com')).toBeInTheDocument();
      });
    });

    it('shows trainer certifications', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Certifications')).toBeInTheDocument();
        expect(screen.getByText('NASM CPT')).toBeInTheDocument();
      });
    });

    it('shows trainer specializations', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Specializations')).toBeInTheDocument();
        expect(screen.getByText('Weight Loss')).toBeInTheDocument();
      });
    });

    it('shows Disconnect button', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('shows View Profile button', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
      });
    });

    it('renders trainer-specific quick actions', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Start Workout')).toBeInTheDocument();
        expect(screen.getByText('View Program')).toBeInTheDocument();
        expect(screen.getByText('Message Trainer')).toBeInTheDocument();
        expect(screen.getByText('Track Progress')).toBeInTheDocument();
      });
    });
  });

  describe('Disconnect Flow', () => {
    const mockConnection = {
      id: 'conn-1',
      status: 'active',
      connectedAt: '2024-01-01T00:00:00Z',
      trainer: {
        id: 'trainer-1',
        email: 'trainer@example.com',
        role: 'trainer' as const,
        userProfile: {
          id: 'up-1',
          userId: 'trainer-1',
          bio: 'Coach Mike',
          preferredUnits: 'metric' as const,
          isPublic: true,
          createdAt: '2024-01-01',
        },
        trainerCertifications: [],
        trainerSpecializations: [],
      },
    };

    beforeEach(() => {
      mockGetClientTrainer.mockResolvedValue(mockConnection);
      mockDisconnectTrainer.mockResolvedValue(undefined);
    });

    it('calls disconnectTrainer when disconnect is confirmed', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Disconnect'));
      await waitFor(() => {
        expect(mockDisconnectTrainer).toHaveBeenCalled();
      });
    });

    it('does not disconnect when confirm is cancelled', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Disconnect'));
      expect(mockDisconnectTrainer).not.toHaveBeenCalled();
    });
  });

  describe('Stat Cards', () => {
    beforeEach(() => {
      mockGetClientTrainer.mockRejectedValue(new Error('No trainer'));
    });

    it('renders completed workouts stat', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const card = screen.getByTestId('stat-card-completed-workouts');
        expect(card).toHaveTextContent('Completed Workouts');
        expect(card).toHaveTextContent('24');
      });
    });

    it('renders current streak stat', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const card = screen.getByTestId('stat-card-current-streak');
        expect(card).toHaveTextContent('Current Streak');
        expect(card).toHaveTextContent('5');
      });
    });

    it('renders program progress stat', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const card = screen.getByTestId('stat-card-program-progress');
        expect(card).toHaveTextContent('Program Progress');
        expect(card).toHaveTextContent('67%');
      });
    });

    it('renders achieved goals stat', async () => {
      render(<EnhancedClientDashboard />);
      await waitFor(() => {
        const card = screen.getByTestId('stat-card-achieved-goals');
        expect(card).toHaveTextContent('Goals Achieved');
        expect(card).toHaveTextContent('3');
      });
    });
  });
});
