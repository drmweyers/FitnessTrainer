/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Clock: () => <span data-testid="icon-clock" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  MoreVertical: () => <span data-testid="icon-more-vertical" />,
}));

import WorkoutCard from '../WorkoutCard';
import { Workout } from '@/types/workout';

function createMockWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w1',
    title: 'Upper Body Strength',
    type: 'strength',
    duration: 45,
    exercises: [
      { id: 'e1', name: 'Bench Press', sets: 3, reps: 10, weight: '135 lbs' },
      { id: 'e2', name: 'Shoulder Press', sets: 3, reps: 10, weight: '95 lbs' },
    ],
    completed: false,
    synced: true,
    ...overrides,
  };
}

describe('WorkoutCard', () => {
  describe('Rendering', () => {
    it('should render workout title', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument();
    });

    it('should render workout duration', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('should render exercise count', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      expect(screen.getByText(/2 exercises/)).toBeInTheDocument();
    });

    it('should show completed icon when workout is completed', () => {
      render(<WorkoutCard workout={createMockWorkout({ completed: true })} isActive={true} />);
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
    });

    it('should not show completed icon when workout is not completed', () => {
      render(<WorkoutCard workout={createMockWorkout({ completed: false })} isActive={true} />);
      expect(screen.queryByTestId('icon-check-circle')).not.toBeInTheDocument();
    });

    it('should show unsynced icon when workout is not synced', () => {
      render(<WorkoutCard workout={createMockWorkout({ synced: false })} isActive={true} />);
      expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
    });

    it('should not show unsynced icon when workout is synced', () => {
      render(<WorkoutCard workout={createMockWorkout({ synced: true })} isActive={true} />);
      expect(screen.queryByTestId('icon-alert-circle')).not.toBeInTheDocument();
    });

    it('should show chevron down icon when not expanded', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
    });

    it('should not show exercise count for workouts with no exercises', () => {
      render(<WorkoutCard workout={createMockWorkout({ exercises: [] })} isActive={true} />);
      expect(screen.queryByText(/exercises/)).not.toBeInTheDocument();
    });
  });

  describe('Expansion', () => {
    it('should not show exercise details by default', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });

    it('should show exercise details when clicked', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
    });

    it('should show sets and reps info when expanded', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      const setsInfo = screen.getAllByText(/3 sets × 10 reps/);
      expect(setsInfo.length).toBeGreaterThanOrEqual(1);
    });

    it('should show weight info when expanded', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText(/135 lbs/)).toBeInTheDocument();
    });

    it('should show Edit button when expanded', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should show chevron up icon when expanded', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<WorkoutCard workout={createMockWorkout()} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });

    it('should show "No exercises for this day" for empty workouts', () => {
      render(<WorkoutCard workout={createMockWorkout({ exercises: [] })} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText('No exercises for this day')).toBeInTheDocument();
    });

    it('should format time for duration-based exercises', () => {
      const workout = createMockWorkout({
        exercises: [
          { id: 'e1', name: 'Treadmill Run', sets: 1, reps: 0, duration: 2400 },
        ],
      });
      render(<WorkoutCard workout={workout} isActive={true} />);
      fireEvent.click(screen.getByText('Upper Body Strength'));
      expect(screen.getByText(/40:00/)).toBeInTheDocument();
    });
  });

  describe('Workout types', () => {
    it('should render strength workout', () => {
      render(<WorkoutCard workout={createMockWorkout({ type: 'strength' })} isActive={true} />);
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument();
    });

    it('should render cardio workout', () => {
      render(<WorkoutCard workout={createMockWorkout({ type: 'cardio', title: 'Cardio Session' })} isActive={true} />);
      expect(screen.getByText('Cardio Session')).toBeInTheDocument();
    });

    it('should render hiit workout', () => {
      render(<WorkoutCard workout={createMockWorkout({ type: 'hiit', title: 'HIIT Session' })} isActive={true} />);
      expect(screen.getByText('HIIT Session')).toBeInTheDocument();
    });

    it('should render rest day', () => {
      render(<WorkoutCard workout={createMockWorkout({ type: 'rest', title: 'Rest Day', exercises: [], duration: 0 })} isActive={true} />);
      expect(screen.getByText('Rest Day')).toBeInTheDocument();
    });
  });
});
