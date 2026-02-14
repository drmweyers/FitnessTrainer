/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import ExerciseSelector from '../ExerciseSelector';

// Mock the context
const mockDispatch = jest.fn();

const defaultContextState = {
  weeks: [
    {
      weekNumber: 1,
      name: 'Week 1',
      workouts: [
        {
          dayNumber: 1,
          name: 'Push Day',
          workoutType: 'strength',
          exercises: [],
        },
      ],
    },
  ],
  currentWeekIndex: 0,
  currentWorkoutIndex: 0,
};

const mockUseProgramBuilder = jest.fn(() => ({
  state: { ...defaultContextState },
  dispatch: mockDispatch,
}));

jest.mock('../ProgramBuilderContext', () => ({
  useProgramBuilder: (...args: any[]) => mockUseProgramBuilder(...args),
}));

// Mock exercise service
jest.mock('@/services/exerciseService', () => ({
  searchExercises: jest.fn(() =>
    Promise.resolve({
      exercises: [
        {
          id: 'ex-1',
          exerciseId: 'ex-1',
          name: 'Bench Press',
          gifUrl: 'bench.gif',
          bodyParts: ['chest'],
          equipments: ['barbell'],
          targetMuscles: ['pectorals'],
          secondaryMuscles: ['triceps'],
          instructions: [],
        },
        {
          id: 'ex-2',
          exerciseId: 'ex-2',
          name: 'Shoulder Press',
          gifUrl: 'shoulder.gif',
          bodyParts: ['shoulders'],
          equipments: ['dumbbell'],
          targetMuscles: ['deltoids'],
          secondaryMuscles: ['triceps'],
          instructions: [],
        },
      ],
    })
  ),
  getFilterOptions: jest.fn(() =>
    Promise.resolve({
      bodyParts: ['chest', 'shoulders', 'back'],
      equipments: ['barbell', 'dumbbell', 'cable'],
      targetMuscles: ['pectorals', 'deltoids', 'lats'],
      secondaryMuscles: ['triceps', 'biceps'],
    })
  ),
}));

// Mock child components
jest.mock('../SupersetBuilder', () => {
  return function MockSupersetBuilder({ onClose, onUpdateExercises }: any) {
    return (
      <div data-testid="superset-builder">
        Superset Builder
        <button onClick={onClose}>Close Superset</button>
        <button onClick={() => onUpdateExercises([])}>Update</button>
      </div>
    );
  };
});

jest.mock('../RPEIntegration', () => {
  return function MockRPEIntegration({ onClose, onUpdateExercises }: any) {
    return (
      <div data-testid="rpe-integration">
        RPE Integration
        <button onClick={onClose}>Close RPE</button>
        <button onClick={() => onUpdateExercises([])}>Update</button>
      </div>
    );
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  GripVertical: () => <span data-testid="grip-icon" />,
  Target: () => <span data-testid="target-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Save: () => <span data-testid="save-icon" />,
  X: () => <span data-testid="x-icon" />,
  Dumbbell: () => <span data-testid="dumbbell-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  Star: () => <span data-testid="star-icon" />,
  Link: () => <span data-testid="link-icon" />,
}));

describe('ExerciseSelector', () => {
  const defaultProps = {
    onNext: jest.fn(),
    onPrev: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseProgramBuilder.mockReturnValue({
      state: { ...defaultContextState },
      dispatch: mockDispatch,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders without crashing', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(screen.getByText('Exercise Selection')).toBeInTheDocument();
    });

    it('displays current workout context', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(screen.getByText(/Week 1/)).toBeInTheDocument();
      expect(screen.getByText(/Push Day/)).toBeInTheDocument();
    });

    it('shows empty state when no exercises selected', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(screen.getByText('No exercises selected')).toBeInTheDocument();
    });

    it('renders No Workout Selected when no current workout', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: { weeks: [{ weekNumber: 1, name: 'Week 1', workouts: [] }], currentWeekIndex: 0, currentWorkoutIndex: 0 },
        dispatch: mockDispatch,
      });
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(screen.getByText('No Workout Selected')).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    it('hides image on error for exercise card', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        const img = screen.getByAltText('Bench Press');
        fireEvent.error(img);
        expect(img).toHaveStyle({ display: 'none' });
      });
    });

    it('hides image on error for selected exercise', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [{ exerciseId: 'ex-1', orderIndex: 0, configurations: [] }]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        if (images.length > 1) {
          fireEvent.error(images[1]);
          expect(images[1]).toHaveStyle({ display: 'none' });
        }
      });
    });
  });

  describe('Filter Functionality', () => {
    it('toggles filter panel', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Filters'));
      await waitFor(() => expect(screen.getByText('Body Part')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Filters'));
      await waitFor(() => expect(screen.queryByText('Body Part')).not.toBeInTheDocument());
    });

    it('applies body part filter', async () => {
      const { searchExercises } = require('@/services/exerciseService');
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Filters'));
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'chest' } });
      });
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        expect(searchExercises).toHaveBeenCalledWith(expect.objectContaining({ bodyParts: ['chest'] }), 1, 20);
      });
    });

    it('applies equipment filter', async () => {
      const { searchExercises } = require('@/services/exerciseService');
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Filters'));
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'barbell' } });
      });
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        expect(searchExercises).toHaveBeenCalledWith(expect.objectContaining({ equipments: ['barbell'] }), 1, 20);
      });
    });

    it('clears filters', async () => {
      const { searchExercises } = require('@/services/exerciseService');
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Filters'));
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'chest' } });
      });
      await act(async () => { jest.advanceTimersByTime(400); });
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: '' } });
      });
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        expect(searchExercises).toHaveBeenCalledWith(expect.objectContaining({ bodyParts: [] }), 1, 20);
      });
    });
  });

  describe('Exercise Addition', () => {
    it('adds exercise to workout', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'UPDATE_WORKOUT',
        payload: expect.objectContaining({
          workout: expect.objectContaining({
            exercises: expect.arrayContaining([expect.objectContaining({ exerciseId: 'ex-1' })])
          })
        })
      }));
    });

    it('creates default configuration', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({
            exercises: expect.arrayContaining([
              expect.objectContaining({
                configurations: expect.arrayContaining([
                  expect.objectContaining({ setNumber: 1, setType: 'working', reps: '8-12', restSeconds: 60 })
                ])
              })
            ])
          })
        })
      }));
    });

    it('prevents adding duplicates', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [{ exerciseId: 'ex-1', orderIndex: 0, configurations: [] }]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      await waitFor(() => {
        const addedButton = screen.getByText('Added');
        expect(addedButton).toBeDisabled();
      });
    });
  });

  describe('Selected Exercise Management', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [
                { exerciseId: 'ex-1', orderIndex: 0, notes: 'Test notes', configurations: [
                  { setNumber: 1, setType: 'working', reps: '8-12', weightGuidance: '70% 1RM', restSeconds: 60, tempo: '3-1-2-0', rpe: 7, rir: 2, notes: '' }
                ]},
                { exerciseId: 'ex-2', orderIndex: 1, configurations: [] }
              ]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
    });

    it('removes exercise', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      const trashButtons = screen.getAllByTestId('trash-icon');
      fireEvent.click(trashButtons[0].closest('button')!);
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'UPDATE_WORKOUT',
        payload: expect.objectContaining({
          workout: expect.objectContaining({
            exercises: expect.arrayContaining([expect.objectContaining({ exerciseId: 'ex-2', orderIndex: 0 })])
          })
        })
      }));
    });

    it('moves exercise up', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      const upButtons = screen.getAllByTestId('chevron-up');
      fireEvent.click(upButtons[1].closest('button')!);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('moves exercise down', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      const downButtons = screen.getAllByTestId('chevron-down');
      const btn = downButtons.map(icon => icon.closest('button')).filter(b => b && !b.disabled)[0];
      if (btn) fireEvent.click(btn);
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Exercise Configuration', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [{ exerciseId: 'ex-1', orderIndex: 0, notes: '', configurations: [
                { setNumber: 1, setType: 'working', reps: '8-12', weightGuidance: '', restSeconds: 60, tempo: '', rpe: undefined, rir: undefined, notes: '' }
              ]}]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
    });

    it('opens configuration modal', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => {
        expect(screen.getByText('Exercise Notes (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Set Configuration')).toBeInTheDocument();
      });
    });

    it('updates exercise notes', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => {
        const notesInput = screen.getByPlaceholderText(/special instructions/i);
        fireEvent.change(notesInput, { target: { value: 'New notes' } });
      });
      fireEvent.click(screen.getByText('Save Configuration'));
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          workout: expect.objectContaining({
            exercises: expect.arrayContaining([expect.objectContaining({ notes: 'New notes' })])
          })
        })
      }));
    });

    it('adds new set configuration', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => fireEvent.click(screen.getByText('Add Set')));
      await waitFor(() => expect(screen.getByText('Set 2')).toBeInTheDocument());
    });

    it('removes set configuration', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [{ exerciseId: 'ex-1', orderIndex: 0, configurations: [
                { setNumber: 1, setType: 'working', reps: '8-12', restSeconds: 60 },
                { setNumber: 2, setType: 'working', reps: '8-12', restSeconds: 60 }
              ]}]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => {
        const trashButtons = screen.getAllByTestId('trash-icon').map(icon => icon.closest('button')).filter(btn => btn && !btn.disabled);
        if (trashButtons.length > 0) fireEvent.click(trashButtons[trashButtons.length - 1]!);
      });
      fireEvent.click(screen.getByText('Save Configuration'));
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('updates all set fields', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'drop' } });
        expect(selects[0]).toHaveValue('drop');
        fireEvent.change(screen.getByPlaceholderText('8-12'), { target: { value: '10-15' } });
        fireEvent.change(screen.getByPlaceholderText('60'), { target: { value: 90 } });
        fireEvent.change(screen.getByPlaceholderText('70% 1RM'), { target: { value: '80% 1RM' } });
        fireEvent.change(screen.getByPlaceholderText('7'), { target: { value: 8 } });
        fireEvent.change(screen.getByPlaceholderText('2'), { target: { value: 3 } });
        fireEvent.change(screen.getByPlaceholderText('3-1-2-0'), { target: { value: '2-0-2-0' } });
      });
    });

    it('cancels configuration changes', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Configure'));
      await waitFor(() => {
        const notesInput = screen.getByPlaceholderText(/special instructions/i);
        fireEvent.change(notesInput, { target: { value: 'New notes' } });
      });
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Validation & Navigation', () => {
    it('calls onPrev', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Back to Workouts'));
      expect(defaultProps.onPrev).toHaveBeenCalled();
    });

    it('validates before calling onNext', async () => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [{ exerciseId: 'ex-1', orderIndex: 0, configurations: [] }]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Continue to Preview'));
      expect(defaultProps.onNext).toHaveBeenCalled();
    });

    it('disables Continue when no exercises', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      expect(screen.getByText('Continue to Preview')).toBeDisabled();
    });
  });

  describe('Superset & RPE Modals', () => {
    beforeEach(() => {
      mockUseProgramBuilder.mockReturnValue({
        state: {
          ...defaultContextState,
          weeks: [{
            ...defaultContextState.weeks[0],
            workouts: [{
              ...defaultContextState.weeks[0].workouts[0],
              exercises: [
                { exerciseId: 'ex-1', orderIndex: 0, configurations: [] },
                { exerciseId: 'ex-2', orderIndex: 1, configurations: [] }
              ]
            }]
          }]
        },
        dispatch: mockDispatch,
      });
    });

    it('opens and closes superset builder', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Create Supersets'));
      await waitFor(() => expect(screen.getByTestId('superset-builder')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Close Superset'));
      await waitFor(() => expect(screen.queryByTestId('superset-builder')).not.toBeInTheDocument());
    });

    it('opens and closes RPE integration', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Set RPE/RIR'));
      await waitFor(() => expect(screen.getByTestId('rpe-integration')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Close RPE'));
      await waitFor(() => expect(screen.queryByTestId('rpe-integration')).not.toBeInTheDocument());
    });

    it('updates exercises from superset builder', async () => {
      render(<ExerciseSelector {...defaultProps} />);
      await act(async () => { jest.advanceTimersByTime(500); });
      fireEvent.click(screen.getByText('Create Supersets'));
      await waitFor(() => {
        const updateButton = screen.getByText('Update');
        fireEvent.click(updateButton);
      });
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'UPDATE_WORKOUT' }));
    });
  });
});
