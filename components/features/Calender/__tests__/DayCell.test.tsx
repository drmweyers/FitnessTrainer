/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
}));

jest.mock('../WorkoutCard', () => {
  return function MockWorkoutCard({ workout }: any) {
    return <div data-testid={`workout-${workout.id}`}>{workout.title}</div>;
  };
});

import DayCell from '../DayCell';

describe('DayCell', () => {
  const today = new Date();

  const createDay = (overrides: any = {}) => ({
    date: overrides.date || new Date(2024, 5, 15),
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    workouts: overrides.workouts || [],
    ...overrides,
  });

  it('should render the day number', () => {
    const day = createDay({ date: new Date(2024, 5, 15) });
    render(<DayCell day={day} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should render workouts', () => {
    const day = createDay({
      workouts: [
        { id: 'w1', title: 'Push Day', type: 'strength', exercises: [], syncStatus: 'synced' },
      ],
    });
    render(<DayCell day={day} />);
    expect(screen.getByText('Push Day')).toBeInTheDocument();
  });

  it('should show "No workouts" text for empty active day', () => {
    const day = createDay({ workouts: [] });
    render(<DayCell day={day} />);
    expect(screen.getByText('No workouts')).toBeInTheDocument();
  });

  it('should show "Inactive" text for inactive day', () => {
    const day = createDay({ isActive: false, workouts: [] });
    render(<DayCell day={day} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should apply today styling for today date', () => {
    const day = createDay({ date: today });
    const { container } = render(<DayCell day={day} />);
    expect(container.firstChild).toHaveClass('bg-blue-50');
  });

  it('should show plus button on hover for active day', () => {
    const day = createDay({ workouts: [] });
    const { container } = render(<DayCell day={day} />);
    fireEvent.mouseEnter(container.firstChild!);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should render multiple workouts', () => {
    const day = createDay({
      workouts: [
        { id: 'w1', title: 'Push Day', type: 'strength', exercises: [], syncStatus: 'synced' },
        { id: 'w2', title: 'Pull Day', type: 'strength', exercises: [], syncStatus: 'synced' },
      ],
    });
    render(<DayCell day={day} />);
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
  });
});
