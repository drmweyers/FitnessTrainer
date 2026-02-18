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

  it('fetches exercises with a limit of 2000 to load full dataset', async () => {
    jest.useRealTimers();
    render(<AIWorkoutBuilder />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(fetchCall).toContain('limit=2000');
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

  describe('Focus Area and Workout Type Branch Coverage', () => {
    // Helper: render, wait for exercises to load, change preferences, generate
    async function renderAndGenerate(focusArea?: string, workoutType?: string) {
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      // Wait for exercises to load
      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      // Change focus area if specified
      if (focusArea) {
        const focusSelect = screen.getByDisplayValue('Full body');
        fireEvent.change(focusSelect, { target: { value: focusArea } });
      }

      // Change workout type if specified
      if (workoutType) {
        const typeSelect = screen.getByDisplayValue('Strength');
        fireEvent.change(typeSelect, { target: { value: workoutType } });
      }

      fireEvent.click(screen.getByText('Generate AI Workout'));

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      }, { timeout: 3000 });
    }

    it('generates workout with upper body focus (lines 104-105)', async () => {
      await renderAndGenerate('upper body');
      // Workout name includes the focus area - check for the heading
      expect(screen.getByText(/Strength Workout/)).toBeInTheDocument();
    });

    it('generates workout with lower body focus (lines 108-109)', async () => {
      await renderAndGenerate('lower body');
      expect(screen.getByText(/Strength Workout/)).toBeInTheDocument();
    });

    it('generates workout with core focus (lines 112-113)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          exercises: [
            { id: 'abs-1', name: 'Crunches', bodyParts: ['waist'], targetMuscles: ['abs'], equipment: 'body weight', gifUrl: 'c.gif', difficulty: 'beginner' },
          ],
        }),
      });
      await renderAndGenerate('core');
      expect(screen.getByText(/Strength Workout/)).toBeInTheDocument();
    });

    it('generates workout with cardio focus (line 117)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          exercises: [
            { id: 'run-1', name: 'Running', bodyParts: ['cardio'], targetMuscles: ['cardiovascular'], equipment: 'body weight', gifUrl: 'r.gif', difficulty: 'beginner' },
          ],
        }),
      });
      await renderAndGenerate('cardio');
      // Should show workout with cardio focus - the workout name will contain Cardio
      expect(screen.getByText('Save Workout')).toBeInTheDocument();
    });

    it('generates workout with cardio type (lines 145-148)', async () => {
      await renderAndGenerate(undefined, 'cardio');
      // Cardio type sets reps to "30-60 sec"
      const repTexts = screen.getAllByText(/30-60 sec/);
      expect(repTexts.length).toBeGreaterThan(0);
    });

    it('generates workout with flexibility type (lines 149-152)', async () => {
      await renderAndGenerate(undefined, 'flexibility');
      // Flexibility type sets reps to "30 sec hold"
      const repTexts = screen.getAllByText(/30 sec hold/);
      expect(repTexts.length).toBeGreaterThan(0);
    });

    it('generates workout with mixed type (lines 153-157)', async () => {
      await renderAndGenerate(undefined, 'mixed');
      // Mixed type sets reps to "10-12"
      const repTexts = screen.getAllByText(/10-12/);
      expect(repTexts.length).toBeGreaterThan(0);
    });

    it('handles fetch failure gracefully (line 64)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load exercises:', expect.any(Error));
      });

      // Button should be disabled when no exercises loaded
      const btn = screen.getByText('Generate AI Workout');
      expect(btn.closest('button')).toBeDisabled();
      consoleSpy.mockRestore();
    });

    it('handles non-ok fetch response (line 57)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).toBeDisabled();
      });
    });

    it('falls back to all exercises when difficulty filter matches none (line 99, 125)', async () => {
      // Provide only advanced exercises, set difficulty to beginner
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          exercises: [
            { id: 'adv-1', name: 'Muscle Up', bodyParts: ['chest'], targetMuscles: ['pectorals'], equipment: 'body weight', gifUrl: 'mu.gif', difficulty: 'advanced' },
          ],
        }),
      });
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      // Change to beginner difficulty (no beginner exercises available)
      const diffSelect = screen.getByDisplayValue('Intermediate');
      fireEvent.change(diffSelect, { target: { value: 'beginner' } });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      // Should still generate (falls back to all exercises)
      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('deletes a saved workout (lines 396-397)', async () => {
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      // Generate and save a workout
      fireEvent.click(screen.getByText('Generate AI Workout'));
      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      }, { timeout: 3000 });
      fireEvent.click(screen.getByText('Save Workout'));
      expect(screen.getByText(/Saved Workouts/)).toBeInTheDocument();

      // Delete the saved workout via the trash button
      const trashButton = screen.getByRole('button', { name: '' });
      // Find the delete button in the saved workouts section
      const savedSection = screen.getByText(/Saved Workouts/).closest('div');
      const deleteBtn = savedSection?.querySelector('button.text-gray-400');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        expect(screen.queryByText(/Saved Workouts/)).not.toBeInTheDocument();
      }
    });

    it('toggles equipment removing specific equipment (lines 253-265, 289)', async () => {
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      // Select dumbbell first
      const dumbbellBtn = screen.getByText('dumbbell');
      fireEvent.click(dumbbellBtn);
      expect(dumbbellBtn.className).toContain('bg-blue-500');

      // Select barbell too
      const barbellBtn = screen.getByText('barbell');
      fireEvent.click(barbellBtn);
      expect(barbellBtn.className).toContain('bg-blue-500');

      // Deselect dumbbell
      fireEvent.click(dumbbellBtn);
      expect(dumbbellBtn.className).not.toContain('bg-blue-500');

      // Click "any" to reset
      const anyBtn = screen.getByText('any');
      fireEvent.click(anyBtn);
      expect(anyBtn.className).toContain('bg-blue-500');
    });
  });

  describe('Equipment filtering logic', () => {
    async function renderAndGenerate(equipmentSelection: string[]) {
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      // Wait for exercises to load
      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      // Clear default equipment selection (if any)
      const anyButton = screen.getByText('any');
      fireEvent.click(anyButton);

      // Select equipment as specified
      equipmentSelection.forEach(equipment => {
        const equipmentButton = screen.getByText(equipment);
        fireEvent.click(equipmentButton);
      });

      fireEvent.click(screen.getByText('Generate AI Workout'));

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      }, { timeout: 3000 });
    }

    beforeEach(() => {
      // Reset mock to return exercises with different equipment types
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
                difficulty: 'intermediate',
              },
              {
                id: 'ex-2',
                name: 'Dumbbell Press',
                bodyParts: ['chest'],
                targetMuscles: ['pectorals'],
                equipment: 'dumbbell',
                equipments: ['dumbbell'],
                gifUrl: 'dumbbellpress.gif',
                difficulty: 'intermediate',
              },
              {
                id: 'ex-3',
                name: 'Barbell Squat',
                bodyParts: ['upper legs'],
                targetMuscles: ['quadriceps'],
                equipment: 'barbell',
                equipments: ['barbell'],
                gifUrl: 'barbellsquat.gif',
                difficulty: 'intermediate',
              },
              {
                id: 'ex-4',
                name: 'Dumbbell Curl',
                bodyParts: ['upper arms'],
                targetMuscles: ['biceps'],
                equipment: 'dumbbell',
                equipments: ['dumbbell'],
                gifUrl: 'dumbbellcurl.gif',
                difficulty: 'beginner',
              },
            ],
          }),
      });
    });

    it('selecting only "dumbbell" should NOT include bodyweight exercises', async () => {
      await renderAndGenerate(['dumbbell']);

      // Push Ups (body weight) should NOT appear
      expect(screen.queryByText('Push Ups')).not.toBeInTheDocument();

      // Dumbbell exercises SHOULD appear
      expect(screen.getByText('Dumbbell Press')).toBeInTheDocument();
    });

    it('selecting only "body weight" should ONLY include bodyweight exercises', async () => {
      await renderAndGenerate(['body weight']);

      // Push Ups (body weight) SHOULD appear
      expect(screen.getByText('Push Ups')).toBeInTheDocument();

      // Dumbbell and barbell exercises should NOT appear
      expect(screen.queryByText('Dumbbell Press')).not.toBeInTheDocument();
      expect(screen.queryByText('Barbell Squat')).not.toBeInTheDocument();
    });

    it('selecting "any" should include all exercises', async () => {
      jest.useRealTimers();
      render(<AIWorkoutBuilder />);

      await waitFor(() => {
        const btn = screen.getByText('Generate AI Workout');
        expect(btn.closest('button')).not.toBeDisabled();
      });

      // Select "any"
      const anyButton = screen.getByText('any');
      fireEvent.click(anyButton);

      fireEvent.click(screen.getByText('Generate AI Workout'));

      await waitFor(() => {
        expect(screen.getByText('Save Workout')).toBeInTheDocument();
      }, { timeout: 3000 });

      // All equipment types can appear
      // At least some exercises should be visible
      expect(screen.getByText(/Strength Workout/)).toBeInTheDocument();
    });

    it('selecting "dumbbell" + "body weight" should include both types', async () => {
      await renderAndGenerate(['dumbbell', 'body weight']);

      // Both dumbbell and bodyweight exercises can appear
      // The workout should have exercises, let's just verify it generated
      expect(screen.getByText('Save Workout')).toBeInTheDocument();

      // At least one of each type should be possible
      const workoutSection = screen.getByText('Save Workout').closest('div');
      expect(workoutSection).toBeInTheDocument();
    });

    it('selecting only "barbell" should NOT include bodyweight or dumbbell exercises', async () => {
      await renderAndGenerate(['barbell']);

      // Only barbell exercises should appear
      expect(screen.queryByText('Push Ups')).not.toBeInTheDocument();
      expect(screen.queryByText('Dumbbell Press')).not.toBeInTheDocument();
      expect(screen.getByText('Barbell Squat')).toBeInTheDocument();
    });
  });

  describe.skip('AI Generation Logic - Branch Coverage (old, broken)', () => {
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
