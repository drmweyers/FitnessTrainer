/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { WorkoutProgress } from '../WorkoutProgress';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Activity: () => <span data-testid="icon-activity" />,
}));

const mockUseWorkoutProgress = jest.fn();
jest.mock('@/hooks/useWorkouts', () => ({
  useWorkoutProgress: (...args: any[]) => mockUseWorkoutProgress(...args),
}));

describe('WorkoutProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseWorkoutProgress.mockReturnValue({ data: null, isLoading: true });
    render(<WorkoutProgress />);
    expect(screen.getByText('Loading progress...')).toBeInTheDocument();
  });

  it('renders empty state when no progress data', () => {
    mockUseWorkoutProgress.mockReturnValue({ data: null, isLoading: false });
    render(<WorkoutProgress />);
    expect(screen.getByText('No Progress Data')).toBeInTheDocument();
    expect(screen.getByText('Complete workouts to track your progress over time')).toBeInTheDocument();
  });

  it('renders progress heading with data', () => {
    mockUseWorkoutProgress.mockReturnValue({
      data: { personalRecords: [] },
      isLoading: false,
    });
    render(<WorkoutProgress />);
    expect(screen.getByText('Workout Progress')).toBeInTheDocument();
    expect(screen.getByText('Track your improvement over time')).toBeInTheDocument();
  });

  it('renders personal records when available', () => {
    mockUseWorkoutProgress.mockReturnValue({
      data: {
        personalRecords: [
          { id: 'pr1', exercise: { name: 'Bench Press' }, date: '2024-01-15', sets: 3, weight: 225 },
        ],
      },
      isLoading: false,
    });
    render(<WorkoutProgress />);
    expect(screen.getByText('Personal Records')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('PR')).toBeInTheDocument();
  });

  it('renders chart placeholders', () => {
    mockUseWorkoutProgress.mockReturnValue({
      data: { personalRecords: [] },
      isLoading: false,
    });
    render(<WorkoutProgress />);
    expect(screen.getByText('Volume Trend')).toBeInTheDocument();
    expect(screen.getByText('Weight Progress')).toBeInTheDocument();
  });

  it('passes exerciseId to hook', () => {
    mockUseWorkoutProgress.mockReturnValue({ data: null, isLoading: false });
    render(<WorkoutProgress exerciseId="ex-1" />);
    expect(mockUseWorkoutProgress).toHaveBeenCalledWith('ex-1');
  });
});
