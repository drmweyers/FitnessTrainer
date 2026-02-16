/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientActivityTimeline from '../ClientActivityTimeline';

describe('ClientActivityTimeline', () => {
  it('renders with mock activities when no activities provided', () => {
    render(<ClientActivityTimeline clientId="test-client" />);
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('shows empty state when activities array is empty', () => {
    render(<ClientActivityTimeline clientId="test-client" activities={[]} />);
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });

  it('renders provided activities', () => {
    const activities = [
      {
        id: '1',
        type: 'workout' as const,
        description: 'Completed "Test Workout"',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'measurement' as const,
        description: 'Recorded measurements',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    render(<ClientActivityTimeline clientId="test-client" activities={activities} />);
    expect(screen.getByText('Completed "Test Workout"')).toBeInTheDocument();
    expect(screen.getByText('Recorded measurements')).toBeInTheDocument();
  });

  it('limits activities to specified limit', () => {
    const activities = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      type: 'workout' as const,
      description: `Workout ${i}`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }));

    render(<ClientActivityTimeline clientId="test-client" activities={activities} limit={5} />);
    expect(screen.getByText(/showing 5 of 15 activities/i)).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    const activities = [
      {
        id: '1',
        type: 'workout' as const,
        description: 'Recent workout',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
    ];

    render(<ClientActivityTimeline clientId="test-client" activities={activities} />);
    expect(screen.getByText(/30 minutes ago/i)).toBeInTheDocument();
  });
});
