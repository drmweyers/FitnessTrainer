/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WorkoutHistory } from '../WorkoutHistory';

// Mock hooks
jest.mock('@/hooks/useWorkouts', () => ({
  useWorkouts: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useWorkout: jest.fn(() => ({
    data: null,
  })),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Target: () => <span data-testid="target-icon" />,
  TrendingUp: () => <span data-testid="trending-icon" />,
}));

import { useWorkouts } from '@/hooks/useWorkouts';
const mockUseWorkouts = useWorkouts as jest.Mock;

describe('WorkoutHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseWorkouts.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('renders empty state when no workouts', () => {
    mockUseWorkouts.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('No workout history found')).toBeInTheDocument();
    expect(screen.getByText(/Start logging workouts/)).toBeInTheDocument();
  });

  it('renders header text', () => {
    mockUseWorkouts.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('Workout History')).toBeInTheDocument();
    expect(screen.getByText('Your past workout sessions')).toBeInTheDocument();
  });

  it('renders workout list with summary cards', () => {
    const mockWorkouts = [
      {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
        programWorkout: { name: 'Push Day' },
        status: 'completed',
        completedSets: 12,
        totalSets: 12,
        totalVolume: 5000,
      },
      {
        id: 'w2',
        startTime: '2025-01-14T09:00:00Z',
        endTime: '2025-01-14T09:45:00Z',
        programWorkout: { name: 'Pull Day' },
        status: 'completed',
        completedSets: 10,
        totalSets: 10,
        totalVolume: 4200,
      },
    ];

    mockUseWorkouts.mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
    });

    render(<WorkoutHistory />);

    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
  });

  it('renders View Progress link', () => {
    mockUseWorkouts.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('View Progress')).toBeInTheDocument();
  });

  it('shows workout stats in summary cards', () => {
    const mockWorkouts = [
      {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
        programWorkout: { name: 'Push Day' },
        status: 'completed',
        completedSets: 12,
        totalSets: 15,
        totalVolume: 5000,
      },
    ];

    mockUseWorkouts.mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
    });

    render(<WorkoutHistory />);

    expect(screen.getByText('12/15')).toBeInTheDocument();
    expect(screen.getByText('5000 lbs')).toBeInTheDocument();
    expect(screen.getByText('60min')).toBeInTheDocument();
  });

  it('shows status badge', () => {
    const mockWorkouts = [
      {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        programWorkout: { name: 'Push' },
        status: 'completed',
        completedSets: 0,
        totalSets: 0,
        totalVolume: 0,
      },
    ];

    mockUseWorkouts.mockReturnValue({
      data: mockWorkouts,
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('passes clientId and limit to useWorkouts hook', () => {
    mockUseWorkouts.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkoutHistory clientId="client-1" limit={5} />);

    expect(mockUseWorkouts).toHaveBeenCalledWith({ clientId: 'client-1', limit: 5 });
  });

  it('uses default limit of 10 when not specified', () => {
    mockUseWorkouts.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<WorkoutHistory />);

    expect(mockUseWorkouts).toHaveBeenCalledWith({ clientId: undefined, limit: 10 });
  });
});
