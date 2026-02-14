/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ActiveWorkoutSession } from '../ActiveWorkoutSession';

// Mock hooks
const mockMutate = jest.fn();
const mockLogSetMutate = jest.fn();

jest.mock('@/hooks/useWorkouts', () => ({
  useActiveWorkout: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useCompleteWorkout: jest.fn(() => ({
    mutate: mockMutate,
  })),
  useLogSet: jest.fn(() => ({
    mutate: mockLogSetMutate,
  })),
}));

// Mock child components
jest.mock('../SetLogger', () => ({
  SetLogger: ({ exerciseName, setNumber, onLogSet }: any) => (
    <div data-testid={`set-logger-${setNumber}`}>
      <span>{exerciseName} - Set {setNumber}</span>
      <button onClick={() => onLogSet({ actualReps: 10 })}>Log Set</button>
    </div>
  ),
}));

jest.mock('../RestTimer', () => ({
  RestTimer: ({ onComplete, onClose }: any) => (
    <div data-testid="rest-timer">
      <span>Rest Timer</span>
      <button onClick={onComplete}>Complete Rest</button>
      <button onClick={onClose}>Close Timer</button>
    </div>
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  Target: () => <span data-testid="target-icon" />,
}));

// Re-import the mock to use in tests
import { useActiveWorkout } from '@/hooks/useWorkouts';
const mockUseActiveWorkout = useActiveWorkout as jest.Mock;

describe('ActiveWorkoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseActiveWorkout.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('Loading active workout...')).toBeInTheDocument();
  });

  it('renders empty state when no active workout', () => {
    mockUseActiveWorkout.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('No Active Workout')).toBeInTheDocument();
    expect(screen.getByText(/Start a workout from your program/)).toBeInTheDocument();
  });

  it('renders active workout with header info', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push Day' },
      program: { name: 'PPL Program' },
      weekNumber: 2,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 12,
      completedSets: 4,
      totalVolume: '1500',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench Press' },
          targetReps: '8-12',
          restSeconds: 90,
          targetWeight: '135 lbs',
          setLogs: [
            { id: 'set-1', actualReps: 0, previousBest: { reps: 10, weight: 130 } },
          ],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText(/PPL Program/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Total Sets
    expect(screen.getByText('4')).toBeInTheDocument(); // Completed Sets
    expect(screen.getByText('1500')).toBeInTheDocument(); // Volume
  });

  it('shows current exercise details', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Leg Day' },
      program: { name: 'Full Body' },
      weekNumber: 1,
      dayNumber: 3,
      startTime: new Date().toISOString(),
      totalSets: 6,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Squat' },
          targetReps: '5-5',
          restSeconds: 120,
          targetWeight: '225 lbs',
          setLogs: [],
        },
        {
          exercise: { id: 'ex-2', name: 'Deadlift' },
          targetReps: '5-5',
          restSeconds: 180,
          targetWeight: null,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByText('5-5')).toBeInTheDocument();
    expect(screen.getByText('120s')).toBeInTheDocument();
    expect(screen.getByText('225 lbs')).toBeInTheDocument();
  });

  it('opens rest timer when button is clicked', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Arms' },
      program: { name: 'Bro Split' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 4,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Curl' },
          targetReps: '10-12',
          restSeconds: 60,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    // Rest timer button should be visible
    const restTimerBtn = screen.getByText('Rest Timer');
    fireEvent.click(restTimerBtn);

    // Rest timer component should appear
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  });

  it('shows complete workout button when workout is in progress', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 3,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('Complete Workout')).toBeInTheDocument();
  });

  it('does not show complete workout button when workout is completed', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 3,
      completedSets: 3,
      totalVolume: '500',
      status: 'completed',
      exerciseLogs: [],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.queryByText('Complete Workout')).not.toBeInTheDocument();
  });

  it('shows no sets logged message when exercise has no set logs', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 3,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('No sets logged yet')).toBeInTheDocument();
  });

  it('calls completeWorkout mutation when Complete Workout is clicked', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 1,
      totalVolume: '100',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [
            {
              id: 'set-1',
              actualReps: 12,
              targetReps: '8-12',
            },
          ],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    const completeBtn = screen.getByText('Complete Workout');
    fireEvent.click(completeBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      { sessionId: 'session-1', notes: 'Workout completed!' },
      expect.any(Object)
    );
  });

  it('closes rest timer when close button is clicked', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    fireEvent.click(screen.getByText('Rest Timer'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Timer'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('closes rest timer when rest is completed', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    fireEvent.click(screen.getByText('Rest Timer'));
    fireEvent.click(screen.getByText('Complete Rest'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('uses actualStartTime if available for display', () => {
    const actualStart = new Date('2024-01-15T10:30:00');
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      actualStartTime: actualStart.toISOString(),
      startTime: new Date('2024-01-15T08:00:00').toISOString(),
      scheduledDate: new Date('2024-01-14T08:00:00').toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
  });

  it('falls back to scheduledDate if neither actualStartTime nor startTime available', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      scheduledDate: new Date('2024-01-14T08:00:00').toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
  });

  it('calculates 0% progress when no exercises', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 0,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('0 / 0 exercises')).toBeInTheDocument();
  });

  it('does not show target weight if not provided', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Push-ups' },
          targetReps: '15-20',
          restSeconds: 60,
          targetWeight: null,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByText('15-20')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    // Weight should not be shown
    expect(screen.queryByText(/Weight:/)).not.toBeInTheDocument();
  });

  it('renders with clientId prop', () => {
    mockUseActiveWorkout.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<ActiveWorkoutSession clientId="client-123" />);
    expect(screen.getByText('No Active Workout')).toBeInTheDocument();
  });

  it('logs set and calls mutation', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [
            { id: 'set-1', actualReps: 0 },
          ],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);

    const logButton = screen.getByText('Log Set');
    fireEvent.click(logButton);

    expect(mockLogSetMutate).toHaveBeenCalledWith(
      { sessionId: 'session-1', setData: { actualReps: 10 } },
      expect.any(Object)
    );
  });

  it('shows Target icon in empty state', () => {
    mockUseActiveWorkout.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByTestId('target-icon')).toBeInTheDocument();
  });

  it('shows Clock icon in rest timer button', () => {
    const mockWorkout = {
      id: 'session-1',
      programWorkout: { name: 'Push' },
      program: { name: 'PPL' },
      weekNumber: 1,
      dayNumber: 1,
      startTime: new Date().toISOString(),
      totalSets: 1,
      completedSets: 0,
      totalVolume: '0',
      status: 'in_progress',
      exerciseLogs: [
        {
          exercise: { id: 'ex-1', name: 'Bench' },
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [],
        },
      ],
    };

    mockUseActiveWorkout.mockReturnValue({
      data: mockWorkout,
      isLoading: false,
    });

    render(<ActiveWorkoutSession />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });
});
