/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="icon-check" />,
  Clock: () => <span data-testid="icon-clock" />,
  ChevronRight: () => <span data-testid="icon-chevron" />,
}));

import WorkoutHistory from '../WorkoutHistory';

describe('WorkoutHistory', () => {
  const mockWorkouts = [
    { id: 'w1', date: '2024-03-15', name: 'Upper Body A', completed: true, exercises: 6, completedExercises: 6, duration: 45 },
    { id: 'w2', date: '2024-03-13', name: 'Lower Body A', completed: true, exercises: 5, completedExercises: 4, duration: 50 },
    { id: 'w3', date: '2024-03-11', name: 'Push Day', completed: true, exercises: 6, completedExercises: 5, duration: 40 },
    { id: 'w4', date: '2024-03-09', name: 'Pull Day', completed: true, exercises: 5, completedExercises: 5, duration: 35 },
  ];

  it('should render section title', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    expect(screen.getByText('Workout History')).toBeInTheDocument();
  });

  it('should display only first 3 workouts by default', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    expect(screen.getByText('Upper Body A')).toBeInTheDocument();
    expect(screen.getByText('Lower Body A')).toBeInTheDocument();
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.queryByText('Pull Day')).not.toBeInTheDocument();
  });

  it('should display all workouts when showAll is true', () => {
    render(<WorkoutHistory workouts={mockWorkouts} showAll />);
    expect(screen.getByText('Upper Body A')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
  });

  it('should show View All button when more than 3 workouts', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('should not show View All when showAll is true', () => {
    render(<WorkoutHistory workouts={mockWorkouts} showAll />);
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('should not show View All when 3 or fewer workouts', () => {
    render(<WorkoutHistory workouts={mockWorkouts.slice(0, 3)} />);
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('should display exercise completion counts', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    expect(screen.getByText('6/6 exercises')).toBeInTheDocument();
    expect(screen.getByText('4/5 exercises')).toBeInTheDocument();
  });

  it('should display workout durations', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    expect(screen.getByText('45 minutes')).toBeInTheDocument();
    expect(screen.getByText('50 minutes')).toBeInTheDocument();
  });

  it('should display Completed badge', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    const badges = screen.getAllByText('Completed');
    expect(badges.length).toBe(3); // First 3 shown
  });

  it('should display View Details button for each workout', () => {
    render(<WorkoutHistory workouts={mockWorkouts} />);
    const detailButtons = screen.getAllByText('View Details');
    expect(detailButtons.length).toBe(3);
  });
});
