/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Bell: () => <span data-testid="icon-bell" />,
  Check: () => <span data-testid="icon-check" />,
  X: () => <span data-testid="icon-x" />,
  User: () => <span data-testid="icon-user" />,
  Mail: () => <span data-testid="icon-mail" />,
  Clock: () => <span data-testid="icon-clock" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  UserCheck: () => <span data-testid="icon-user-check" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  Calendar: () => <span data-testid="icon-calendar" />,
}));

import InvitationNotifications from '../InvitationNotifications';

describe('InvitationNotifications', () => {
  const defaultProps = {
    clientEmail: 'client@example.com',
    onAcceptInvitation: jest.fn().mockResolvedValue(undefined),
    onDeclineInvitation: jest.fn().mockResolvedValue(undefined),
  };

  // The component uses mock data with expiresAt: '2024-02-20T10:00:00Z'
  // To make them not-expired, we set "now" to January 2024
  const mockNow = new Date('2024-01-25T12:00:00Z').getTime();
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show loading skeleton initially', () => {
    render(<InvitationNotifications {...defaultProps} />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render invitations after loading', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText(/Trainer Invitations/)).toBeInTheDocument();
    });
  });

  it('should show pending invitation count', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('Trainer Invitations (2)')).toBeInTheDocument();
    });
  });

  it('should display trainer names', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('John Smith - Certified Personal Trainer')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson - Fitness Coach')).toBeInTheDocument();
    });
  });

  it('should display trainer emails', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('john.trainer@fitpro.com')).toBeInTheDocument();
      expect(screen.getByText('sarah.fitness@example.com')).toBeInTheDocument();
    });
  });

  it('should display custom message when present', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText(/I'd love to help you reach your fitness goals/)).toBeInTheDocument();
    });
  });

  it('should display Accept and Decline buttons for each invitation', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Accept')).toHaveLength(2);
      expect(screen.getAllByText('Decline')).toHaveLength(2);
    });
  });

  it('should display View Details button for each invitation', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('View Details')).toHaveLength(2);
    });
  });

  it('should call onAcceptInvitation when Accept is clicked', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Accept')).toHaveLength(2);
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Accept')[0]);
    });

    await waitFor(() => {
      expect(defaultProps.onAcceptInvitation).toHaveBeenCalledWith('token123');
    });
  });

  it('should remove invitation after successful acceptance', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Accept')).toHaveLength(2);
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Accept')[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Trainer Invitations (1)')).toBeInTheDocument();
    });
  });

  it('should call onDeclineInvitation when Decline is clicked', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Decline')).toHaveLength(2);
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Decline')[0]);
    });

    await waitFor(() => {
      expect(defaultProps.onDeclineInvitation).toHaveBeenCalledWith('1');
    });
  });

  it('should show error message when acceptance fails', async () => {
    const failingProps = {
      ...defaultProps,
      onAcceptInvitation: jest.fn().mockRejectedValue(new Error('Network error')),
    };
    render(<InvitationNotifications {...failingProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Accept')).toHaveLength(2);
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText('Accept')[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should expand details when View Details is clicked', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('View Details')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    // Expanded details should show headings and more info
    await waitFor(() => {
      // Check for expanded section content - the invitation details area
      const mailIcons = screen.getAllByTestId('icon-mail');
      // When expanded, there should be more mail icons (one from expanded details)
      expect(mailIcons.length).toBeGreaterThanOrEqual(1);
      // Check for the expires date text
      expect(screen.getByText(/Expires:/)).toBeInTheDocument();
    });
  });

  it('should show Personal Message in expanded details', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getAllByText('View Details')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    await waitFor(() => {
      expect(screen.getByText('Personal Message')).toBeInTheDocument();
    });
  });

  it('should display certification info in preview', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('NASM-CPT')).toBeInTheDocument();
      expect(screen.getByText('ACE-CPT')).toBeInTheDocument();
    });
  });

  it('should display specialization info in preview', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('Specializes in Strength Training')).toBeInTheDocument();
      expect(screen.getByText('Specializes in HIIT Training')).toBeInTheDocument();
    });
  });

  it('should show description text about pending invitations', async () => {
    render(<InvitationNotifications {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('You have pending invitations from personal trainers')).toBeInTheDocument();
    });
  });
});
