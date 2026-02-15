/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

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

    it('should handle HTTP error status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('No Workouts Scheduled')).toBeInTheDocument();
      });
    });
  });

  describe('Start workout button', () => {
    const mockWorkoutData = {
      id: 'workout-1',
      name: 'Upper Body',
      programName: 'Strength Program',
      programId: 'prog-1',
      assignmentId: 'assign-1',
      scheduledDate: '2024-02-20',
      estimatedDuration: 45,
      workoutType: 'strength',
      isCompleted: false,
      exercises: [
        {
          id: 'ex-1',
          name: 'Push-ups',
          sets: [
            { reps: '10', weight: '0 lbs', restTime: 60 },
          ],
          equipment: 'Bodyweight',
          bodyPart: 'Chest',
          targetMuscle: 'Pectorals',
        },
      ],
    };

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockWorkoutData }),
      });
    });

    it('should call onStartWorkout when Start Workout button is clicked', async () => {
      const mockOnStart = jest.fn();
      render(<DailyWorkoutView {...defaultProps} onStartWorkout={mockOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Start Workout')).toBeInTheDocument();
      });

      const startButton = screen.getByText('Start Workout');
      fireEvent.click(startButton);

      expect(mockOnStart).toHaveBeenCalledWith(expect.objectContaining({
        workoutLog: expect.any(Object),
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        isTimerRunning: false,
        isPaused: false,
        totalPausedTime: 0,
      }));
    });

    it('should create workout session with correct structure', async () => {
      const mockOnStart = jest.fn();
      render(<DailyWorkoutView {...defaultProps} onStartWorkout={mockOnStart} />);

      await waitFor(() => {
        expect(screen.getByText('Start Workout')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Workout'));

      expect(mockOnStart).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutLog: expect.objectContaining({
            programAssignmentId: 'assign-1',
            workoutId: 'workout-1',
            workoutName: 'Upper Body',
            status: 'in_progress',
          }),
        })
      );
    });
  });

  describe('Date formatting', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
    });

    it('should show "Today" for current date', async () => {
      const today = new Date().toISOString().split('T')[0];
      render(<DailyWorkoutView {...defaultProps} selectedDate={today} />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.textContent).toContain('Today');
      });
    });

    it('should show formatted date for past date', async () => {
      render(<DailyWorkoutView {...defaultProps} selectedDate="2024-01-15" />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.textContent).toContain('Workouts');
      });
    });
  });

  describe('Multiple workouts', () => {
    beforeEach(() => {
      const mockData = {
        id: 'w-1',
        name: 'First Workout',
        programName: 'Program A',
        programId: 'p-1',
        assignmentId: 'a-1',
        scheduledDate: '2024-02-20',
        estimatedDuration: 30,
        workoutType: 'strength',
        isCompleted: false,
        exercises: [],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });
    });

    it('should show "1 workout scheduled" for single workout', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1 workout scheduled')).toBeInTheDocument();
      });
    });
  });

  describe('Workout type badges', () => {
    it('should show cardio badge with correct styling', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Test Workout',
            programName: 'Test Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 30,
            workoutType: 'cardio',
            isCompleted: false,
            exercises: [],
          },
        }),
      });

      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        const badge = screen.getByText('cardio');
        expect(badge).toHaveClass('bg-green-100');
      });
    });

    it('should show hiit badge with correct styling', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Test Workout',
            programName: 'Test Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 30,
            workoutType: 'hiit',
            isCompleted: false,
            exercises: [],
          },
        }),
      });

      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        const badge = screen.getByText('hiit');
        expect(badge).toHaveClass('bg-orange-100');
      });
    });

    it('should show flexibility badge with correct styling', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Test Workout',
            programName: 'Test Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 30,
            workoutType: 'flexibility',
            isCompleted: false,
            exercises: [],
          },
        }),
      });

      render(<DailyWorkoutView {...defaultProps} />);
      await waitFor(() => {
        const badge = screen.getByText('flexibility');
        expect(badge).toHaveClass('bg-purple-100');
      });
    });
  });

  describe('Exercise preview', () => {
    beforeEach(() => {
      const exercises = Array.from({ length: 8 }, (_, i) => ({
        id: `ex-${i + 1}`,
        name: `Exercise ${i + 1}`,
        sets: [{ reps: '10', weight: '100 lbs', restTime: 60 }],
        equipment: 'Barbell',
        bodyPart: 'Chest',
        targetMuscle: 'Pectorals',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Big Workout',
            programName: 'Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 90,
            workoutType: 'strength',
            isCompleted: false,
            exercises,
          },
        }),
      });
    });

    it('should show "+X more" when more than 6 exercises', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('should show exercise sets, reps, and weight', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        const repsTexts = screen.getAllByText(/10 reps/);
        expect(repsTexts.length).toBeGreaterThan(0);
        const weightTexts = screen.getAllByText(/100 lbs/);
        expect(weightTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Last attempt date', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Workout',
            programName: 'Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 45,
            workoutType: 'strength',
            isCompleted: false,
            lastAttempt: '2024-02-15T10:00:00Z',
            exercises: [],
          },
        }),
      });
    });

    it('should show last completed date', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Last completed:/)).toBeInTheDocument();
      });
    });
  });

  describe('Date input', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });
    });

    it('should render date input with selected date', async () => {
      render(<DailyWorkoutView {...defaultProps} selectedDate="2024-02-20" />);

      await waitFor(() => {
        const dateInput = screen.getByDisplayValue('2024-02-20');
        expect(dateInput).toBeInTheDocument();
      });
    });

    it('should handle date input change', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        const dateInput = screen.getByDisplayValue(defaultProps.selectedDate);
        fireEvent.change(dateInput, { target: { value: '2024-02-21' } });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Date changed:', '2024-02-21');
      consoleSpy.mockRestore();
    });
  });

  describe('Workout stats', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'w-1',
            name: 'Complex Workout',
            programName: 'Program',
            programId: 'p-1',
            assignmentId: 'a-1',
            scheduledDate: '2024-02-20',
            estimatedDuration: 60,
            workoutType: 'strength',
            isCompleted: false,
            exercises: [
              {
                id: 'ex-1',
                name: 'Squats',
                sets: [
                  { reps: '10', weight: '135 lbs', restTime: 180 },
                  { reps: '10', weight: '135 lbs', restTime: 180 },
                  { reps: '8', weight: '145 lbs', restTime: 180 },
                ],
                equipment: 'Barbell',
                bodyPart: 'Legs',
                targetMuscle: 'Quadriceps',
              },
              {
                id: 'ex-2',
                name: 'Deadlifts',
                sets: [
                  { reps: '5', weight: '225 lbs', restTime: 240 },
                  { reps: '5', weight: '225 lbs', restTime: 240 },
                ],
                equipment: 'Barbell',
                bodyPart: 'Back',
                targetMuscle: 'Lats',
              },
            ],
          },
        }),
      });
    });

    it('should calculate total sets correctly', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('5 sets')).toBeInTheDocument();
      });
    });

    it('should show exercise count', async () => {
      render(<DailyWorkoutView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2 exercises')).toBeInTheDocument();
      });
    });
  });
});
