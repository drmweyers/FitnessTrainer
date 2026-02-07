/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

const mockUseWorkouts = jest.fn();
jest.mock('@/hooks/useWorkouts', () => ({
  useWorkouts: (...args: any[]) => mockUseWorkouts(...args),
}));

import { ClientWorkouts } from '../ClientWorkouts';

describe('ClientWorkouts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseWorkouts.mockReturnValue({ data: undefined, isLoading: true });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByText('Loading workouts...')).toBeInTheDocument();
  });

  it('should show empty state when no workouts', () => {
    mockUseWorkouts.mockReturnValue({ data: [], isLoading: false });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByText('No workout history found')).toBeInTheDocument();
  });

  it('should render section title', () => {
    mockUseWorkouts.mockReturnValue({ data: [], isLoading: false });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByText('Workout History')).toBeInTheDocument();
  });

  it('should render View All link', () => {
    mockUseWorkouts.mockReturnValue({ data: [], isLoading: false });
    render(<ClientWorkouts clientId="c1" />);
    const viewAllLink = screen.getByText('View All').closest('a');
    expect(viewAllLink).toHaveAttribute('href', '/clients/c1/history');
  });

  it('should render workout cards when data exists', () => {
    mockUseWorkouts.mockReturnValue({
      data: [
        {
          id: 'w1',
          startTime: '2024-03-15T10:00:00Z',
          endTime: '2024-03-15T11:00:00Z',
          status: 'completed',
          programWorkout: { name: 'Push Day' },
          completedSets: 12,
          totalSets: 15,
          totalVolume: 5000,
        },
      ],
      isLoading: false,
    });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('should display workout stats', () => {
    mockUseWorkouts.mockReturnValue({
      data: [
        {
          id: 'w1',
          startTime: '2024-03-15T10:00:00Z',
          endTime: '2024-03-15T11:00:00Z',
          status: 'completed',
          programWorkout: { name: 'Push Day' },
          completedSets: 12,
          totalSets: 15,
          totalVolume: 5000,
        },
      ],
      isLoading: false,
    });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByText('12/15')).toBeInTheDocument();
    expect(screen.getByText('5000 lbs')).toBeInTheDocument();
    expect(screen.getByText('60min')).toBeInTheDocument();
  });

  it('should render filter dropdown', () => {
    mockUseWorkouts.mockReturnValue({ data: [], isLoading: false });
    render(<ClientWorkouts clientId="c1" />);
    expect(screen.getByDisplayValue('All Time')).toBeInTheDocument();
  });
});
