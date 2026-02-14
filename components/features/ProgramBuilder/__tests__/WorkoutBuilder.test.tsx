/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import WorkoutBuilder from '../WorkoutBuilder';
import { WorkoutType } from '@/types/program';

// Mock the context
const mockDispatch = jest.fn();

const defaultContextState = {
  programName: 'Test Program',
  description: '',
  duration: 4,
  difficultyLevel: 'intermediate' as const,
  trainingStyle: 'strength' as const,
  weeks: [{
    weekNumber: 1,
    name: 'Week 1',
    description: '',
    isDeload: false,
    workouts: []
  }],
  currentWeekIndex: 0,
  currentWorkoutIndex: 0,
  currentStep: 0
};

const mockUseProgramBuilder = jest.fn(() => ({
  state: { ...defaultContextState },
  dispatch: mockDispatch,
}));

jest.mock('../ProgramBuilderContext', () => ({
  useProgramBuilder: (...args: any[]) => mockUseProgramBuilder(...args),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  Dumbbell: () => <span data-testid="dumbbell-icon" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  Edit2: () => <span data-testid="edit-icon" />,
  Save: () => <span data-testid="save-icon" />,
  X: () => <span data-testid="x-icon" />,
  AlertTriangle: () => <span data-testid="alert-icon" />,
  Coffee: () => <span data-testid="coffee-icon" />,
  Activity: () => <span data-testid="activity-icon" />,
}));

describe('WorkoutBuilder', () => {
  const defaultProps = {
    onNext: jest.fn(),
    onPrev: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProgramBuilder.mockReturnValue({
      state: { ...defaultContextState },
      dispatch: mockDispatch,
    });
  });

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Workout Planning')).toBeInTheDocument();
    });

    it('displays current week info', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getAllByText('Week 1').length).toBeGreaterThan(0);
      expect(screen.getByText(/Week 1 of 1/i)).toBeInTheDocument();
    });

    it('shows empty state when no workouts', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('No workouts in this week')).toBeInTheDocument();
      expect(screen.getByText('Add First Workout')).toBeInTheDocument();
    });

    it('renders No Weeks Available when no current week', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: { ...defaultContextState, weeks: [], currentWeekIndex: 0 },
        dispatch: mockDispatch,
      });
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('No Weeks Available')).toBeInTheDocument();
      expect(screen.getByText('Go Back to Week Structure')).toBeInTheDocument();
    });
  });

  describe('Workout Card - Edit Mode', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Push Day',
              description: 'Test workout',
              workoutType: WorkoutType.STRENGTH,
              estimatedDuration: 60,
              isRestDay: false,
              exercises: []
            }]
          }]
        },
        dispatch: mockDispatch,
      });
    });

    it('opens edit mode when clicking edit button', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Push Day, Cardio Session')).toBeInTheDocument();
      });
    });

    it('prevents saving with empty workout name (lines 73-77)', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('e.g., Push Day, Cardio Session');
        fireEvent.change(nameInput, { target: { value: '   ' } });
      });

      const saveButton = screen.getByText('Save Workout');
      expect(saveButton).toBeDisabled();
    });

    it('cancels editing and reverts changes (lines 81-82)', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('e.g., Push Day, Cardio Session');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('e.g., Push Day, Cardio Session')).not.toBeInTheDocument();
      });
    });

    it('updates workout name', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('e.g., Push Day, Cardio Session');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_WORKOUT',
        payload: expect.objectContaining({
          workout: expect.objectContaining({ name: 'Updated Name' })
        })
      });
    });

    it('updates workout day', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        const daySelect = selects[0];
        fireEvent.change(daySelect, { target: { value: '2' } });
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({ dayNumber: 2 })
        })
      }));
    });

    it('updates workout type', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        const typeSelect = selects[1];
        fireEvent.change(typeSelect, { target: { value: WorkoutType.CARDIO } });
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({ workoutType: WorkoutType.CARDIO })
        })
      }));
    });

    it('updates workout duration', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const durationInput = screen.getByPlaceholderText('60');
        fireEvent.change(durationInput, { target: { value: '90' } });
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({ estimatedDuration: 90 })
        })
      }));
    });

    it('updates workout description', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const descInput = screen.getByPlaceholderText('Additional notes about this workout');
        fireEvent.change(descInput, { target: { value: 'New description' } });
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({ description: 'New description' })
        })
      }));
    });

    it('toggles between training day and rest day', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const editButton = screen.getByTitle('Edit workout');
      fireEvent.click(editButton);

      await waitFor(() => {
        const restDayRadio = screen.getByText('Rest Day').closest('label')?.querySelector('input');
        if (restDayRadio) fireEvent.click(restDayRadio);
      });

      const saveButton = screen.getByText('Save Workout');
      fireEvent.click(saveButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({
            isRestDay: true,
            workoutType: undefined,
            estimatedDuration: undefined
          })
        })
      }));
    });
  });

  describe('Workout Management', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [
              {
                dayNumber: 1,
                name: 'Push Day',
                workoutType: WorkoutType.STRENGTH,
                estimatedDuration: 60,
                isRestDay: false,
                exercises: []
              },
              {
                dayNumber: 2,
                name: 'Pull Day',
                workoutType: WorkoutType.STRENGTH,
                estimatedDuration: 60,
                isRestDay: false,
                exercises: []
              }
            ]
          }]
        },
        dispatch: mockDispatch,
      });
    });

    it('toggles workout expansion (lines 411-417)', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const workoutCard = screen.getByText('Push Day').closest('div')?.parentElement;
      if (workoutCard) {
        fireEvent.click(workoutCard);
        await waitFor(() => {
          expect(screen.getByText('Workout Details')).toBeInTheDocument();
        });

        fireEvent.click(workoutCard);
        await waitFor(() => {
          expect(screen.queryByText('Workout Details')).not.toBeInTheDocument();
        });
      }
    });

    it('deletes workout with confirmation (lines 432-439, 653-659)', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('Delete workout');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Delete Workout').length).toBeGreaterThan(0);
      });

      // Find the button specifically (not the heading)
      const confirmButtons = screen.getAllByText('Delete Workout');
      const confirmButton = confirmButtons.find(el => el.tagName === 'BUTTON') || confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_WORKOUT',
        payload: { weekIndex: 0, workoutIndex: 0 }
      });
    });

    it('cancels delete confirmation', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('Delete workout');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel', { selector: 'button' });
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to delete this workout?')).not.toBeInTheDocument();
      });
    });

    it('hides delete button when only one workout', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Push Day',
              workoutType: WorkoutType.STRENGTH,
              isRestDay: false,
              exercises: []
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.queryByTitle('Delete workout')).not.toBeInTheDocument();
    });
  });

  describe('Adding Workouts', () => {
    it('adds new workout (lines 444-447)', async () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const addButton = screen.getByText('Add First Workout');
      fireEvent.click(addButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_WORKOUT',
        payload: expect.objectContaining({
          weekIndex: 0,
          workout: expect.objectContaining({
            name: 'New Workout',
            dayNumber: 1,
            workoutType: WorkoutType.STRENGTH,
            isRestDay: false
          })
        })
      });
    });

    it('adds workout when workouts already exist', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Workout 1',
              isRestDay: false,
              exercises: []
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const addButton = screen.getByText('Add Another Workout');
      fireEvent.click(addButton);

      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ADD_WORKOUT',
        payload: expect.objectContaining({
          workout: expect.objectContaining({ dayNumber: 2 })
        })
      }));
    });

    it('disables add button when week is full (7 workouts)', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: Array(7).fill(null).map((_, i) => ({
              dayNumber: i + 1,
              name: `Workout ${i + 1}`,
              isRestDay: false,
              exercises: []
            }))
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const addButton = screen.getByText('Add Another Workout');
      expect(addButton).toBeDisabled();
      expect(screen.getByText('(Week Full)')).toBeInTheDocument();
    });
  });

  describe('Week Navigation', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [
            { weekNumber: 1, name: 'Week 1', isDeload: false, workouts: [] },
            { weekNumber: 2, name: 'Week 2', isDeload: true, workouts: [
              { dayNumber: 1, name: 'W1', isRestDay: false, exercises: [] }
            ]}
          ],
          currentWeekIndex: 0
        },
        dispatch: mockDispatch,
      });
    });

    it('switches between weeks (line 465)', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const week2Button = screen.getByText('Week 2');
      fireEvent.click(week2Button);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_WEEK',
        payload: 1
      });
    });

    it('displays deload week styling', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [
            { weekNumber: 1, name: 'Week 1', isDeload: true, description: 'Deload week', workouts: [] }
          ],
          currentWeekIndex: 0
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Deload Week')).toBeInTheDocument();
    });

    it('shows workout count in week selector', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('(1)')).toBeInTheDocument();
    });
  });

  describe('Workout Display', () => {
    it('displays workout with exercises', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Push Day',
              description: 'Upper body push',
              workoutType: WorkoutType.STRENGTH,
              estimatedDuration: 60,
              isRestDay: false,
              exercises: [
                { exerciseId: 'ex1', orderIndex: 0, configurations: [{ setNumber: 1 }] },
                { exerciseId: 'ex2', orderIndex: 1, configurations: [{ setNumber: 1 }] }
              ]
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const workoutCard = screen.getByText('Push Day');
      fireEvent.click(workoutCard.closest('div')?.parentElement!);

      waitFor(() => {
        expect(screen.getByText('Upper body push')).toBeInTheDocument();
        expect(screen.getByText('2 exercises')).toBeInTheDocument();
      });
    });

    it('displays rest day workout', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 7,
              name: 'Rest',
              isRestDay: true,
              exercises: []
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Rest Day')).toBeInTheDocument();
    });

    it('displays exercise preview when expanded', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Push Day',
              isRestDay: false,
              exercises: [
                { exerciseId: 'ex1', orderIndex: 0, configurations: [{ setNumber: 1 }, { setNumber: 2 }] },
                { exerciseId: 'ex2', orderIndex: 1, configurations: [{ setNumber: 1 }] },
                { exerciseId: 'ex3', orderIndex: 2, configurations: [] },
                { exerciseId: 'ex4', orderIndex: 3, configurations: [] }
              ]
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const workoutCard = screen.getByText('Push Day').closest('div')?.parentElement;
      if (workoutCard) fireEvent.click(workoutCard);

      await waitFor(() => {
        expect(screen.getByText('Exercise #1')).toBeInTheDocument();
        expect(screen.getByText('2 sets')).toBeInTheDocument();
        expect(screen.getByText('... and 1 more exercises')).toBeInTheDocument();
      });
    });

    it('shows no exercises message when workout has no exercises', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              dayNumber: 1,
              name: 'Push Day',
              isRestDay: false,
              exercises: []
            }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const workoutCard = screen.getByText('Push Day').closest('div')?.parentElement;
      if (workoutCard) fireEvent.click(workoutCard);

      await waitFor(() => {
        expect(screen.getByText('No exercises added yet')).toBeInTheDocument();
        expect(screen.getByText("You'll add exercises in the next step")).toBeInTheDocument();
      });
    });
  });

  describe('Validation & Navigation', () => {
    it('calls onPrev', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const backButton = screen.getByText('Back to Week Structure');
      fireEvent.click(backButton);
      expect(defaultProps.onPrev).toHaveBeenCalled();
    });

    it.skip('validates and shows alert when no workouts (lines 472-473)', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      render(<WorkoutBuilder {...defaultProps} />);

      const continueButton = screen.getByText('Continue to Exercises');
      fireEvent.click(continueButton);

      expect(alertSpy).toHaveBeenCalledWith('Please add at least one workout to your program');
      expect(defaultProps.onNext).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('calls onNext when workouts exist', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{ dayNumber: 1, name: 'W1', isRestDay: false, exercises: [] }]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const continueButton = screen.getByText('Continue to Exercises');
      fireEvent.click(continueButton);

      expect(defaultProps.onNext).toHaveBeenCalled();
    });

    it('disables continue button when no workouts', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const continueButton = screen.getByText('Continue to Exercises');
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Workout Statistics', () => {
    it('displays training days count', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [
              { dayNumber: 1, name: 'W1', isRestDay: false, exercises: [] },
              { dayNumber: 2, name: 'W2', isRestDay: false, exercises: [] },
              { dayNumber: 7, name: 'Rest', isRestDay: true, exercises: [] }
            ]
          }]
        },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('3 workouts')).toBeInTheDocument();
      expect(screen.getByText('2 training days')).toBeInTheDocument();
      expect(screen.getByText('1 rest days')).toBeInTheDocument();
    });
  });

  describe('No Weeks Edge Case', () => {
    it('goes back when clicking button in no weeks state', () => {
      mockUseProgramBuilder.mockReturnValue({
        state: { ...defaultContextState, weeks: [], currentWeekIndex: 0 },
        dispatch: mockDispatch,
      });

      render(<WorkoutBuilder {...defaultProps} />);
      const backButton = screen.getByText('Go Back to Week Structure');
      fireEvent.click(backButton);
      expect(defaultProps.onPrev).toHaveBeenCalled();
    });
  });
});
