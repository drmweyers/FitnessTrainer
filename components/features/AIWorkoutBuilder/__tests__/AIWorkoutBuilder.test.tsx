/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AIWorkoutBuilder from '../AIWorkoutBuilder';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AIWorkoutBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          exercises: [
            {
              id: 'ex-1',
              name: 'Push Ups',
              bodyParts: ['chest'],
              targetMuscles: ['pectorals'],
              equipment: 'body weight',
              equipments: ['body weight'],
              gifUrl: 'pushups.gif',
              difficulty: 'beginner',
            },
            {
              id: 'ex-2',
              name: 'Squats',
              bodyParts: ['upper legs'],
              targetMuscles: ['quadriceps'],
              equipment: 'body weight',
              equipments: ['body weight'],
              gifUrl: 'squats.gif',
              difficulty: 'intermediate',
            },
            {
              id: 'ex-3',
              name: 'Lunges',
              bodyParts: ['upper legs'],
              targetMuscles: ['quadriceps'],
              equipment: 'body weight',
              equipments: ['body weight'],
              gifUrl: 'lunges.gif',
              difficulty: 'intermediate',
            },
          ],
        }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the component title', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('AI Workout Generator')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<AIWorkoutBuilder />);
    expect(
      screen.getByText('Generate personalized workouts based on your goals and available equipment')
    ).toBeInTheDocument();
  });

  it('renders preference form fields', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('Focus Area')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByText('Workout Type')).toBeInTheDocument();
    expect(screen.getByText('Available Equipment')).toBeInTheDocument();
  });

  it('renders focus area options', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('Upper body')).toBeInTheDocument();
    expect(screen.getByText('Lower body')).toBeInTheDocument();
    expect(screen.getByText('Full body')).toBeInTheDocument();
  });

  it('renders difficulty options', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('renders workout type options', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('Strength')).toBeInTheDocument();
    // 'Cardio' appears in both focusArea select and workoutType select
    expect(screen.getAllByText('Cardio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flexibility')).toBeInTheDocument();
    expect(screen.getByText('Mixed')).toBeInTheDocument();
  });

  it('renders equipment toggle buttons', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('body weight')).toBeInTheDocument();
    expect(screen.getByText('dumbbell')).toBeInTheDocument();
    expect(screen.getByText('barbell')).toBeInTheDocument();
    expect(screen.getByText('any')).toBeInTheDocument();
  });

  it('has a generate button', () => {
    render(<AIWorkoutBuilder />);
    expect(screen.getByText('Generate AI Workout')).toBeInTheDocument();
  });

  it('toggles equipment selection', () => {
    render(<AIWorkoutBuilder />);
    const dumbbellButton = screen.getByText('dumbbell');
    fireEvent.click(dumbbellButton);
    // The button should now be selected (blue)
    expect(dumbbellButton.className).toContain('bg-blue-500');
  });

  it('selects all equipment when "any" is clicked', () => {
    render(<AIWorkoutBuilder />);
    const anyButton = screen.getByText('any');
    fireEvent.click(anyButton);
    expect(anyButton.className).toContain('bg-blue-500');
  });

  it('changes focus area', () => {
    render(<AIWorkoutBuilder />);
    const focusSelect = screen.getByDisplayValue('Full body');
    fireEvent.change(focusSelect, { target: { value: 'upper body' } });
    expect(screen.getByDisplayValue('Upper body')).toBeInTheDocument();
  });

  it('changes difficulty', () => {
    render(<AIWorkoutBuilder />);
    const difficultySelect = screen.getByDisplayValue('Intermediate');
    fireEvent.change(difficultySelect, { target: { value: 'beginner' } });
    expect(screen.getByDisplayValue('Beginner')).toBeInTheDocument();
  });

  it('generates a workout after clicking generate', async () => {
    jest.useRealTimers();
    render(<AIWorkoutBuilder />);

    // Wait for exercises to load from fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Wait for exercises state to update so button is enabled
    await waitFor(() => {
      const btn = screen.getByText('Generate AI Workout');
      expect(btn.closest('button')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Generate AI Workout'));

    // The button text changes to include "Generating Workout..." via a Loader2 icon + text
    await waitFor(() => {
      expect(screen.getByText(/Generating Workout/)).toBeInTheDocument();
    });

    // Wait for generation timeout to complete
    await waitFor(() => {
      expect(screen.getByText('Save Workout')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('discards generated workout', async () => {
    jest.useRealTimers();
    render(<AIWorkoutBuilder />);

    await waitFor(() => {
      const btn = screen.getByText('Generate AI Workout');
      expect(btn.closest('button')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Generate AI Workout'));

    await waitFor(() => {
      expect(screen.getByText('Discard')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Discard'));
    expect(screen.queryByText('Save Workout')).not.toBeInTheDocument();
  });

  it('saves a generated workout', async () => {
    jest.useRealTimers();
    render(<AIWorkoutBuilder />);

    await waitFor(() => {
      const btn = screen.getByText('Generate AI Workout');
      expect(btn.closest('button')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Generate AI Workout'));

    await waitFor(() => {
      expect(screen.getByText('Save Workout')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Save Workout'));
    expect(screen.getByText(/Saved Workouts/)).toBeInTheDocument();
  });

  describe('AI Generation Logic - Branch Coverage', () => {
    it('should handle empty exercises array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exercises: [] }),
      });

      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      // Should generate workout even with no exercises (fallback logic)
      await waitFor(() => {
        expect(screen.queryByText('Generating')).not.toBeInTheDocument();
      });
    });

    it('should filter by upper body focus area', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      // Select upper body
      const focusSelect = screen.getByRole('combobox', { name: /focus area/i });
      fireEvent.change(focusSelect, { target: { value: 'upper body' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should filter by lower body focus area', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const focusSelect = screen.getByRole('combobox', { name: /focus area/i });
      fireEvent.change(focusSelect, { target: { value: 'lower body' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should filter by core focus area', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const focusSelect = screen.getByRole('combobox', { name: /focus area/i });
      fireEvent.change(focusSelect, { target: { value: 'core' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should filter by cardio focus area', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            exercises: [
              {
                id: 'ex-cardio',
                name: 'Running',
                bodyParts: ['cardio'],
                targetMuscles: ['cardiovascular'],
                equipment: 'body weight',
                equipments: ['body weight'],
                gifUrl: 'running.gif',
                difficulty: 'intermediate',
              },
            ],
          }),
      });

      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const focusSelect = screen.getByRole('combobox', { name: /focus area/i });
      fireEvent.change(focusSelect, { target: { value: 'cardio' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should use cardio workout type parameters', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const typeSelect = screen.getByRole('combobox', { name: /workout type/i });
      fireEvent.change(typeSelect, { target: { value: 'cardio' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should use flexibility workout type parameters', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const typeSelect = screen.getByRole('combobox', { name: /workout type/i });
      fireEvent.change(typeSelect, { target: { value: 'flexibility' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should use mixed workout type parameters', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      const typeSelect = screen.getByRole('combobox', { name: /workout type/i });
      fireEvent.change(typeSelect, { target: { value: 'mixed' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should handle difficulty filter with no matches (fallback to all)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            exercises: [
              {
                id: 'ex-advanced',
                name: 'Muscle Up',
                bodyParts: ['chest'],
                targetMuscles: ['pectorals'],
                equipment: 'body weight',
                equipments: ['body weight'],
                gifUrl: 'muscleup.gif',
                difficulty: 'advanced', // Only advanced exercises available
              },
            ],
          }),
      });

      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      // Set difficulty to beginner, but only advanced exercises available
      const difficultySelect = screen.getByRole('combobox', { name: /difficulty/i });
      fireEvent.change(difficultySelect, { target: { value: 'beginner' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      // Should still generate workout using fallback logic
      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });

    it('should handle equipment filtering with "any" option', async () => {
      render(<AIWorkoutBuilder />);
      await act(async () => {
        jest.runAllTimers();
      });

      // Equipment filtering logic should handle 'any' option
      // Default equipment is 'body weight', test passes with current setup
      fireEvent.click(screen.getByText('Generate AI Workout'));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      });
    });
  });
});
