/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutLogger } from '../WorkoutLogger';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play" />,
  Pause: () => <span data-testid="icon-pause" />,
  Plus: () => <span data-testid="icon-plus" />,
}));

jest.mock('@/hooks/useWorkouts', () => ({
  useActiveWorkout: () => ({ data: null }),
}));

jest.mock('../ActiveWorkoutSession', () => ({
  ActiveWorkoutSession: ({ clientId }: any) => (
    <div data-testid="active-session">Active Session</div>
  ),
}));

describe('WorkoutLogger', () => {
  it('renders the title', () => {
    render(<WorkoutLogger />);
    expect(screen.getByText('Workout Logger')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<WorkoutLogger />);
    expect(screen.getByText('Log your workout session')).toBeInTheDocument();
  });

  it('renders no active workout state', () => {
    render(<WorkoutLogger />);
    expect(screen.getByText('No Active Workout')).toBeInTheDocument();
  });

  it('renders start workout button', () => {
    render(<WorkoutLogger />);
    expect(screen.getByText('Start Workout')).toBeInTheDocument();
  });

  it('shows toggle button', () => {
    render(<WorkoutLogger />);
    expect(screen.getByText('Show Active Workout')).toBeInTheDocument();
  });

  it('toggles active session view', () => {
    render(<WorkoutLogger />);
    fireEvent.click(screen.getByText('Show Active Workout'));
    expect(screen.getByTestId('active-session')).toBeInTheDocument();
    expect(screen.getByText('Hide Active Workout')).toBeInTheDocument();
  });

  it('hides no active workout message when showing session', () => {
    render(<WorkoutLogger />);
    fireEvent.click(screen.getByText('Show Active Workout'));
    expect(screen.queryByText('No Active Workout')).not.toBeInTheDocument();
  });
});
