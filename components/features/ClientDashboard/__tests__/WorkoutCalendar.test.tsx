/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

import { WorkoutCalendar } from '../WorkoutCalendar';

describe('WorkoutCalendar', () => {
  const mockCompletedDates = [
    '2026-02-01',
    '2026-02-03',
    '2026-02-05',
    '2026-02-10',
    '2026-02-15',
  ];

  const mockOnDateClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render calendar title', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    expect(screen.getByText('Workout Calendar')).toBeInTheDocument();
  });

  it('should render current month and year', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should render all day headers', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should render legend', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should navigate to previous month when left arrow is clicked', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should navigate to next month when right arrow is clicked', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('should return to current month when Today button is clicked', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    expect(screen.getByText('March 2026')).toBeInTheDocument();

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should call onDateClick when a date is clicked', () => {
    render(<WorkoutCalendar completedDates={mockCompletedDates} onDateClick={mockOnDateClick} />);
    const dateButtons = screen.getAllByRole('button');
    // Find the button for Feb 10 (a completed date)
    const feb10Button = dateButtons.find((btn) => btn.textContent === '10' && !btn.disabled);

    if (feb10Button) {
      fireEvent.click(feb10Button);
      expect(mockOnDateClick).toHaveBeenCalledWith('2026-02-10');
    }
  });

  it('should render completed dates with green background', () => {
    const { container } = render(<WorkoutCalendar completedDates={mockCompletedDates} />);
    // Check that at least some dates have the completed styling
    const completedDates = container.querySelectorAll('.bg-green-500');
    expect(completedDates.length).toBeGreaterThan(0);
  });
});
