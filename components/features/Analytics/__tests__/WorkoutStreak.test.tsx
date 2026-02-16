/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkoutStreak from '../WorkoutStreak';

describe('WorkoutStreak', () => {
  it('renders current and best streak', () => {
    render(<WorkoutStreak currentStreak={5} bestStreak={10} />);
    expect(screen.getByText(/workout streak/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows fire emoji for active streaks', () => {
    const { container } = render(<WorkoutStreak currentStreak={3} bestStreak={5} />);
    expect(container.textContent).toContain('🔥');
  });

  it('shows trophy emoji for best streaks > 7 days', () => {
    const { container } = render(<WorkoutStreak currentStreak={5} bestStreak={8} />);
    expect(container.textContent).toContain('🏆');
  });

  it('shows encouragement for zero current streak', () => {
    render(<WorkoutStreak currentStreak={0} bestStreak={5} />);
    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
  });

  it('shows personal best message when current equals best', () => {
    render(<WorkoutStreak currentStreak={7} bestStreak={7} />);
    expect(screen.getByText(/new personal best/i)).toBeInTheDocument();
  });

  it('shows days to beat record when current < best', () => {
    render(<WorkoutStreak currentStreak={5} bestStreak={10} />);
    expect(screen.getByText(/5 days to beat your record/i)).toBeInTheDocument();
  });

  it('handles zero streaks gracefully', () => {
    render(<WorkoutStreak currentStreak={0} bestStreak={0} />);
    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
    expect(screen.getByText('Complete workouts daily')).toBeInTheDocument();
  });
});
