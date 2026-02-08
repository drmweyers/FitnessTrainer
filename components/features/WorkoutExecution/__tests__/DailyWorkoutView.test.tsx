/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  Target: () => <span data-testid="icon-target" />,
  Zap: () => <span data-testid="icon-zap" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  Eye: () => <span data-testid="icon-eye" />,
  Star: () => <span data-testid="icon-star" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Activity: () => <span data-testid="icon-activity" />,
  MessageSquare: () => <span data-testid="icon-message-square" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
  Award: () => <span data-testid="icon-award" />,
}));

jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, leftIcon, variant, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {leftIcon}
      {children}
    </button>
  ),
}));

jest.mock('@/components/shared/Card', () => {
  const CardComponent = ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  );
  CardComponent.Header = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  CardComponent.Title = ({ children, className, ...props }: any) => <h3 className={className} {...props}>{children}</h3>;
  CardComponent.Content = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
  CardComponent.Footer = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return { Card: CardComponent };
});

import DailyWorkoutView from '../DailyWorkoutView';

describe('DailyWorkoutView', () => {
  const defaultProps = {
    clientId: 'client-1',
    selectedDate: '2024-02-20',
    onStartWorkout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('mock-token');
  });

  describe('Loading state', () => {
    it('should show loading spinner initially', () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as any;
      render(<DailyWorkoutView {...defaultProps} />);
      expect(screen.getByText("Loading today's workouts...")).toBeInTheDocument();
    });
  });

  describe('Empty state (no workouts)', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
    });

    it('should show "No Workouts Scheduled" when no workouts', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('No Workouts Scheduled')).toBeInTheDocument();
      });
    });

    it('should show header with date', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        // The header shows date + "Workouts"
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading.textContent).toContain('Workouts');
      });
    });

    it('should show "No workouts scheduled" in subtitle', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('No workouts scheduled')).toBeInTheDocument();
      });
    });
  });

  describe('With workout data', () => {
    const mockWorkoutData = {
      id: 'workout-1',
      name: 'Chest & Triceps',
      programName: 'Strength Builder',
      programId: 'prog-1',
      assignmentId: 'assign-1',
      scheduledDate: '2024-02-20',
      estimatedDuration: 60,
      workoutType: 'strength',
      isCompleted: false,
      exercises: [
        {
          id: 'ex-1',
          name: 'Bench Press',
          sets: [
            { reps: '8-10', weight: 135, restTime: 180 },
            { reps: '8-10', weight: 135, restTime: 180 },
          ],
          equipment: 'Barbell',
          bodyPart: 'Chest',
          targetMuscle: 'Pectorals',
        },
      ],
      trainerNotes: 'Focus on form today',
    };

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockWorkoutData }),
      });
    });

    it('should render workout name', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Chest & Triceps')).toBeInTheDocument();
      });
    });

    it('should render program name', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Strength Builder')).toBeInTheDocument();
      });
    });

    it('should render workout type badge', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('strength')).toBeInTheDocument();
      });
    });

    it('should render estimated duration', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('60 min')).toBeInTheDocument();
      });
    });

    it('should render exercise count', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('1 exercises')).toBeInTheDocument();
      });
    });

    it('should show Exercise Preview section', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Exercise Preview')).toBeInTheDocument();
      });
    });

    it('should render exercise name in preview', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
      });
    });

    it('should show trainer notes', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Trainer Notes')).toBeInTheDocument();
        expect(screen.getByText('Focus on form today')).toBeInTheDocument();
      });
    });

    it('should show Start Workout button for incomplete workout', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Start Workout')).toBeInTheDocument();
      });
    });

    it('should show Preview button', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });
    });

    it('should show "1 workout scheduled" subtitle', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('1 workout scheduled')).toBeInTheDocument();
      });
    });
  });

  describe('Completed workout', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Completed Workout',
            programName: 'My Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 45,
            workoutType: 'strength',
            isCompleted: true,
            exercises: [],
          },
        }),
      });
    });

    it('should show View Results button for completed workout', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('View Results')).toBeInTheDocument();
      });
    });

    it('should not show Start Workout button for completed workout', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.queryByText('Start Workout')).not.toBeInTheDocument();
      });
    });
  });

  describe('Weekly progress cards', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
    });

    it('should show weekly progress section', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
      });
    });

    it('should show current streak', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Current Streak')).toBeInTheDocument();
        expect(screen.getByText('7 days')).toBeInTheDocument();
      });
    });

    it('should show weekly goal percentage', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Weekly Goal')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should show achievements count', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
      });
    });
  });

  describe('Recent achievements', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
    });

    it('should show Recent Achievements section', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
      });
    });

    it('should show personal best achievement', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Bench Press PR!')).toBeInTheDocument();
        expect(screen.getByText('Hit 145 lbs for 8 reps')).toBeInTheDocument();
      });
    });

    it('should show streak achievement', async () => {
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('7-Day Streak!')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show empty state when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('No Workouts Scheduled')).toBeInTheDocument();
      });
    });
  });
});
