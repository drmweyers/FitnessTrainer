/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Activity: () => <span data-testid="icon-activity" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Clock: () => <span data-testid="icon-clock" />,
}));

import TrainingOverview from '../TrainingOverview';

describe('TrainingOverview', () => {
  const mockClient = {
    workouts: [
      { id: 'w1', date: '2024-03-15', name: 'Upper Body A', completed: true, exercises: 6, completedExercises: 6, duration: 45 },
      { id: 'w2', date: '2024-03-13', name: 'Lower Body A', completed: true, exercises: 5, completedExercises: 4, duration: 50 },
      { id: 'w3', date: '2024-03-11', name: 'Push Day', completed: false, exercises: 6, completedExercises: 3, duration: 30 },
    ],
    upcomingWorkouts: [
      { id: 'u1', date: '2024-03-20', name: 'Pull Day', scheduled: true },
    ],
  };

  it('should render section title', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('Training Overview')).toBeInTheDocument();
  });

  it('should calculate and display completion rate', () => {
    // Total exercises: 6+5+6=17, completed: 6+4+3=13, 13/17 = 76%
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('should display exercise completion count', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('13/17 exercises completed')).toBeInTheDocument();
  });

  it('should display completed workouts count', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display average workout duration', () => {
    // (45+50+30)/3 = 41.67, rounded to 42
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('42 min')).toBeInTheDocument();
  });

  it('should display session count', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('Based on 3 sessions')).toBeInTheDocument();
  });

  it('should display last completed workout', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('Last Completed Workout')).toBeInTheDocument();
    expect(screen.getByText('Upper Body A')).toBeInTheDocument();
  });

  it('should display next scheduled workout', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('Next Scheduled Workout')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
  });

  it('should show View Workout button for next workout', () => {
    render(<TrainingOverview client={mockClient} />);
    expect(screen.getByText('View Workout')).toBeInTheDocument();
  });

  it('should show empty states when no workouts', () => {
    const emptyClient = { workouts: [], upcomingWorkouts: [] };
    render(<TrainingOverview client={emptyClient} />);
    expect(screen.getByText('No workouts completed yet')).toBeInTheDocument();
    expect(screen.getByText('No upcoming workouts scheduled')).toBeInTheDocument();
  });

  it('should show 0% completion rate when no exercises', () => {
    const emptyClient = { workouts: [], upcomingWorkouts: [] };
    render(<TrainingOverview client={emptyClient} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
