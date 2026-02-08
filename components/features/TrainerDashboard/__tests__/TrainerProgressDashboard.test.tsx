/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Activity: () => <span data-testid="icon-activity" />,
  Users: () => <span data-testid="icon-users" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  Play: () => <span data-testid="icon-play" />,
  Pause: () => <span data-testid="icon-pause" />,
  Target: () => <span data-testid="icon-target" />,
  MessageSquare: () => <span data-testid="icon-message-square" />,
  Eye: () => <span data-testid="icon-eye" />,
  RefreshCw: ({ className }: any) => <span data-testid="icon-refresh" className={className} />,
  Download: () => <span data-testid="icon-download" />,
  BarChart3: () => <span data-testid="icon-bar-chart" />,
  Zap: () => <span data-testid="icon-zap" />,
}));

// Mock shared components
jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, disabled, leftIcon, className, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {leftIcon}
      {children}
    </button>
  ),
}));

jest.mock('@/components/shared/Card', () => {
  const CardComponent = ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  );
  CardComponent.Header = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  CardComponent.Title = ({ children, className, ...props }: any) => <h3 className={className} {...props}>{children}</h3>;
  CardComponent.Content = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
  CardComponent.Footer = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return { Card: CardComponent };
});

import TrainerProgressDashboard from '../TrainerProgressDashboard';

describe('TrainerProgressDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the dashboard (loading resolves synchronously with mock data)', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    // The mock data loads synchronously, so by next tick, dashboard is ready
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Monitor client progress and workout activity')).toBeInTheDocument();
    });
  });

  it('should render dashboard after loading', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    // Advance timer to complete loading (mock data is set immediately but state update async)
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
  });

  it('should display key metrics after loading', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Total Clients')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });
  });

  it('should show active clients count', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('18 active this week')).toBeInTheDocument();
    });
  });

  it('should display Today\'s Workouts metric', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText("Today's Workouts")).toBeInTheDocument();
      expect(screen.getByText('8/12')).toBeInTheDocument();
    });
  });

  it('should display Live Workouts section', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Live Workouts (2)')).toBeInTheDocument();
    });
  });

  it('should display live workout clients', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument();
      expect(screen.getByText('Mike Wilson')).toBeInTheDocument();
      expect(screen.getByText('Lower Body Power')).toBeInTheDocument();
    });
  });

  it('should display completion percentage for live workouts', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('should display Recent Activity section', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Alex Thompson')).toBeInTheDocument();
      expect(screen.getByText('Lisa Chen')).toBeInTheDocument();
      expect(screen.getByText('David Brown')).toBeInTheDocument();
    });
  });

  it('should display Upcoming Today section', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Upcoming Today')).toBeInTheDocument();
      expect(screen.getByText('Emma Davis')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
  });

  it('should display Alerts & Concerns section', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Alerts & Concerns')).toBeInTheDocument();
      expect(screen.getByText('Jennifer White')).toBeInTheDocument();
      expect(screen.getByText('Robert Garcia')).toBeInTheDocument();
    });
  });

  it('should display alert severity levels', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  it('should render Quick Actions section', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeInTheDocument();
      expect(screen.getByText('Manage Clients')).toBeInTheDocument();
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });
  });

  it('should show Refresh and Export Data buttons', async () => {
    render(<TrainerProgressDashboard trainerId="t-1" />);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });
});
