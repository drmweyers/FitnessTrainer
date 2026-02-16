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
  const MockLink = ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock lucide-react
jest.mock('lucide-react', () => {
  const Calendar = () => <span data-testid="calendar-icon" />;
  Calendar.displayName = 'Calendar';

  const Clock = () => <span data-testid="clock-icon" />;
  Clock.displayName = 'Clock';

  const Target = () => <span data-testid="target-icon" />;
  Target.displayName = 'Target';

  const TrendingUp = () => <span data-testid="trending-icon" />;
  TrendingUp.displayName = 'TrendingUp';

  return {
    Calendar,
    Clock,
    Target,
    TrendingUp,
  };
});

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

  it('shows workout detail when a card is clicked', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T11:00:00Z',
      programWorkout: { name: 'Push Day' },
      status: 'completed',
      completedSets: 12,
      totalSets: 12,
      totalVolume: 5000,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    const { useWorkout } = require('@/hooks/useWorkouts');
    (useWorkout as jest.Mock).mockReturnValue({
      data: {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        status: 'completed',
        program: { name: 'Push Program' },
        exerciseLogs: [
          {
            id: 'el1',
            exercise: { name: 'Bench Press' },
            setLogs: [
              { id: 's1', actualReps: 10, actualWeight: 135, rpe: 8, notes: 'Felt strong' },
              { id: 's2', actualReps: 8, actualWeight: 135 },
            ],
          },
        ],
        notes: 'Great session',
      },
    });

    render(<WorkoutHistory />);

    // Click the workout card
    const card = screen.getByText('Push Day').closest('[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    // Should show workout detail overlay
    expect(screen.getByText('Workout Details')).toBeInTheDocument();
    expect(screen.getByText('Session Info')).toBeInTheDocument();
    expect(screen.getByText('Push Program')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByText(/Bench Press/)).toBeInTheDocument();
    expect(screen.getByText(/10 reps @ 135 lbs/)).toBeInTheDocument();
    expect(screen.getByText('(RPE 8)')).toBeInTheDocument();
    expect(screen.getByText('Felt strong')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Great session')).toBeInTheDocument();
  });

  it('closes workout detail when close button is clicked', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T11:00:00Z',
      programWorkout: { name: 'Push Day' },
      status: 'completed',
      completedSets: 12,
      totalSets: 12,
      totalVolume: 5000,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    const { useWorkout } = require('@/hooks/useWorkouts');
    (useWorkout as jest.Mock).mockReturnValue({
      data: {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        status: 'completed',
        program: { name: 'Push Program' },
      },
    });

    render(<WorkoutHistory />);

    // Open detail
    const card = screen.getByText('Push Day').closest('[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    expect(screen.getByText('Workout Details')).toBeInTheDocument();

    // Close via X button
    const closeBtn = screen.getByRole('button', { name: /✕/ });
    fireEvent.click(closeBtn);

    // Should be back to list view
    expect(screen.queryByText('Workout Details')).not.toBeInTheDocument();
    expect(screen.getByText('Push Day')).toBeInTheDocument();
  });

  it('shows dash for duration when no endTime', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      endTime: null,
      programWorkout: { name: 'Running' },
      status: 'in_progress',
      completedSets: 5,
      totalSets: 10,
      totalVolume: 2000,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows Workout as default name when programWorkout is missing', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      status: 'completed',
      completedSets: 0,
      totalSets: 0,
      totalVolume: 0,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    render(<WorkoutHistory />);
    expect(screen.getByText('Workout')).toBeInTheDocument();
  });

  it('renders workout detail without exerciseLogs or notes', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      programWorkout: { name: 'Quick' },
      status: 'completed',
      completedSets: 0,
      totalSets: 0,
      totalVolume: 0,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    const { useWorkout } = require('@/hooks/useWorkouts');
    (useWorkout as jest.Mock).mockReturnValue({
      data: {
        id: 'w1',
        startTime: '2025-01-15T10:00:00Z',
        status: 'completed',
      },
    });

    render(<WorkoutHistory />);

    const card = screen.getByText('Quick').closest('[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    expect(screen.getByText('Workout Details')).toBeInTheDocument();
    // No exercises or notes sections
    expect(screen.queryByText('Exercises')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('renders null when workout detail data is null', () => {
    const mockWorkout = {
      id: 'w1',
      startTime: '2025-01-15T10:00:00Z',
      programWorkout: { name: 'Test' },
      status: 'completed',
      completedSets: 0,
      totalSets: 0,
      totalVolume: 0,
    };

    mockUseWorkouts.mockReturnValue({
      data: [mockWorkout],
      isLoading: false,
    });

    const { useWorkout } = require('@/hooks/useWorkouts');
    (useWorkout as jest.Mock).mockReturnValue({ data: null });

    render(<WorkoutHistory />);

    const card = screen.getByText('Test').closest('[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    // WorkoutDetail returns null when no data
    expect(screen.queryByText('Workout Details')).not.toBeInTheDocument();
  });
});
