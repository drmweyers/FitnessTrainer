/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import WeekRow from '../WeekRow';

jest.mock('../DayCell', () => ({
  __esModule: true,
  default: ({ day }: any) => (
    <div data-testid={`day-${day.dayNumber}`}>{day.name || `Day ${day.dayNumber}`}</div>
  ),
}));

describe('WeekRow', () => {
  const mockDays = Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    name: `Day ${i + 1}`,
    workouts: [],
  }));

  it('renders 7 day cells', () => {
    render(<WeekRow days={mockDays as any} />);
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`day-${i}`)).toBeInTheDocument();
    }
  });

  it('renders all day names', () => {
    render(<WeekRow days={mockDays as any} />);
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(`Day ${i}`)).toBeInTheDocument();
    }
  });

  it('renders grid layout', () => {
    const { container } = render(<WeekRow days={mockDays as any} />);
    expect(container.firstChild).toHaveClass('grid');
    expect(container.firstChild).toHaveClass('grid-cols-7');
  });
});
