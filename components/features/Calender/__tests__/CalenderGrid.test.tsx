/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Clock: () => <span data-testid="icon-clock" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  MoreVertical: () => <span data-testid="icon-more-vertical" />,
}));

// Mock WeekRow to avoid deep dependency chain
jest.mock('../WeekRow', () => ({
  __esModule: true,
  default: ({ days }: any) => (
    <div data-testid="week-row">
      {days.map((day: any, i: number) => (
        <div key={i} data-testid={`day-cell-${i}`}>
          {day.workouts?.map((w: any) => (
            <span key={w.id}>{w.title}</span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

import CalendarGrid from '../CalenderGrid';

describe('CalendarGrid', () => {
  const startDate = new Date('2024-01-14'); // Sunday

  it('should render without crashing', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Add Week')).toBeInTheDocument();
  });

  it('should render day headers (Sun through Sat)', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should render two WeekRow components', () => {
    render(<CalendarGrid startDate={startDate} />);
    const weekRows = screen.getAllByTestId('week-row');
    expect(weekRows).toHaveLength(2);
  });

  it('should render the Add Week button with Plus icon', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Add Week')).toBeInTheDocument();
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should populate first week with mock workout data', () => {
    render(<CalendarGrid startDate={startDate} />);
    // First week should have workouts from mock data
    expect(screen.getByText('Upper Body Strength')).toBeInTheDocument();
    expect(screen.getByText('Lower Body Strength')).toBeInTheDocument();
    expect(screen.getByText('HIIT Cardio')).toBeInTheDocument();
  });

  it('should populate second week with mock workout data', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Push Workout')).toBeInTheDocument();
    expect(screen.getByText('Pull Workout')).toBeInTheDocument();
    expect(screen.getByText('Leg Workout')).toBeInTheDocument();
  });

  it('should include rest days in the workout data', () => {
    render(<CalendarGrid startDate={startDate} />);
    // Both week 1 and week 2 have rest days
    const restDays = screen.getAllByText('Rest Day');
    expect(restDays.length).toBeGreaterThanOrEqual(1);
  });

  it('should pass 7 days to each WeekRow', () => {
    render(<CalendarGrid startDate={startDate} />);
    const weekRows = screen.getAllByTestId('week-row');
    // Each week row should contain 7 day cells (indices 0-6)
    const firstWeekCells = weekRows[0].querySelectorAll('[data-testid^="day-cell-"]');
    expect(firstWeekCells).toHaveLength(7);
  });

  it('should render flexibility workout in second week', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Flexibility & Mobility')).toBeInTheDocument();
  });

  it('should render cardio workouts', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('Steady State Cardio')).toBeInTheDocument();
  });

  it('should render HIIT workouts in second week', () => {
    render(<CalendarGrid startDate={startDate} />);
    expect(screen.getByText('HIIT Session')).toBeInTheDocument();
  });
});
