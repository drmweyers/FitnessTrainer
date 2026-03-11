/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityLog } from '@/components/admin/ActivityLog';

describe('ActivityLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    render(<ActivityLog />);
    // Loading state shows animated pulse divs
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders activity entries from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            activities: [
              {
                id: 'login-u1',
                userId: 'u1',
                userName: 'john',
                action: 'logged_in',
                resource: 'auth',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'appt-a1',
                userId: 'u2',
                userName: 'trainer',
                action: 'updated',
                resource: 'appointment',
                timestamp: new Date().toISOString(),
                details: 'Morning Session (scheduled)',
              },
            ],
          },
        }),
    });

    render(<ActivityLog />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
      expect(screen.getByText('trainer')).toBeInTheDocument();
      expect(screen.getByText('Morning Session (scheduled)')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/activity?limit=20');
  });

  it('shows empty state when no activities', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { activities: [] },
        }),
    });

    render(<ActivityLog />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ActivityLog />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch activity log')).toBeInTheDocument();
    });
  });

  it('shows error state on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ActivityLog />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
