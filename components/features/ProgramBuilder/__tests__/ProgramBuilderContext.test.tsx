/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ProgramBuilderProvider, useProgramBuilder, programBuilderHelpers } from '../ProgramBuilderContext';
import { ProgramType, DifficultyLevel, WorkoutType } from '@/types/program';

// Test component that exposes the context
function TestConsumer({ onState }: { onState?: (state: any, dispatch: any) => void }) {
  const { state, dispatch } = useProgramBuilder();
  React.useEffect(() => {
    if (onState) onState(state, dispatch);
  }, [state, dispatch, onState]);
  return (
    <div>
      <span data-testid="name">{state.name}</span>
      <span data-testid="step">{state.currentStep}</span>
      <span data-testid="valid">{state.isValid ? 'true' : 'false'}</span>
      <span data-testid="dirty">{state.isDirty ? 'true' : 'false'}</span>
      <span data-testid="loading">{state.isLoading ? 'true' : 'false'}</span>
      <span data-testid="weeks">{state.weeks.length}</span>
      <span data-testid="errors">{JSON.stringify(state.errors)}</span>
      <span data-testid="exercises">{state.selectedExercises.length}</span>
    </div>
  );
}

function renderWithProvider(onState?: (state: any, dispatch: any) => void) {
  return render(
    <ProgramBuilderProvider>
      <TestConsumer onState={onState} />
    </ProgramBuilderProvider>
  );
}

describe('ProgramBuilderContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    renderWithProvider();
    expect(screen.getByTestId('name').textContent).toBe('');
    expect(screen.getByTestId('step').textContent).toBe('1');
    expect(screen.getByTestId('weeks').textContent).toBe('0');
  });

  it('throws error when useProgramBuilder is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useProgramBuilder must be used within a ProgramBuilderProvider');
    consoleError.mockRestore();
  });

  it('handles SET_BASIC_INFO action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_BASIC_INFO', payload: { name: 'My Program' } });
    });
    expect(screen.getByTestId('name').textContent).toBe('My Program');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
  });

  it('auto-generates weeks when durationWeeks changes', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_BASIC_INFO', payload: { durationWeeks: 3 } });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('3');
  });

  it('handles ADD_WEEK action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('1');
  });

  it('handles ADD_WEEK with custom payload', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK', payload: { weekNumber: 1, name: 'Custom Week', isDeload: true, workouts: [] } });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('1');
  });

  it('handles REMOVE_WEEK action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_BASIC_INFO', payload: { durationWeeks: 3 } });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('3');

    act(() => {
      dispatchRef({ type: 'REMOVE_WEEK', payload: 1 });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('2');
  });

  it('handles UPDATE_WEEK action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
      dispatchRef({ type: 'UPDATE_WEEK', payload: { index: 0, week: { weekNumber: 1, name: 'Updated', workouts: [] } } });
    });
    expect(screen.getByTestId('dirty').textContent).toBe('true');
  });

  it('handles DUPLICATE_WEEK action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK', payload: { weekNumber: 1, name: 'Week 1', isDeload: false, workouts: [{ dayNumber: 1, name: 'Day 1' }] } });
    });
    act(() => {
      dispatchRef({ type: 'DUPLICATE_WEEK', payload: 0 });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('2');
  });

  it('handles DUPLICATE_WEEK with invalid index', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'DUPLICATE_WEEK', payload: 99 });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('0');
  });

  it('handles ADD_WORKOUT action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
      dispatchRef({ type: 'ADD_WORKOUT', payload: { weekIndex: 0 } });
    });
    expect(screen.getByTestId('dirty').textContent).toBe('true');
  });

  it('handles ADD_WORKOUT with custom workout', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
      dispatchRef({ type: 'ADD_WORKOUT', payload: { weekIndex: 0, workout: { dayNumber: 1, name: 'Custom', isRestDay: false, exercises: [] } } });
    });
  });

  it('handles REMOVE_WORKOUT action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
      dispatchRef({ type: 'ADD_WORKOUT', payload: { weekIndex: 0 } });
      dispatchRef({ type: 'REMOVE_WORKOUT', payload: { weekIndex: 0, workoutIndex: 0 } });
    });
  });

  it('handles UPDATE_WORKOUT action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_WEEK' });
      dispatchRef({ type: 'ADD_WORKOUT', payload: { weekIndex: 0 } });
      dispatchRef({ type: 'UPDATE_WORKOUT', payload: { weekIndex: 0, workoutIndex: 0, workout: { dayNumber: 2, name: 'Updated', isRestDay: false, exercises: [] } } });
    });
  });

  it('handles SET_CURRENT_WEEK action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_CURRENT_WEEK', payload: 2 });
    });
  });

  it('handles SET_CURRENT_WORKOUT action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_CURRENT_WORKOUT', payload: 3 });
    });
  });

  it('handles ADD_EXERCISES action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_EXERCISES', payload: [{ exerciseId: 'ex-1', orderIndex: 0, setsConfig: {} }] });
    });
    expect(screen.getByTestId('exercises').textContent).toBe('1');
  });

  it('handles REMOVE_EXERCISE action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_EXERCISES', payload: [{ exerciseId: 'ex-1', orderIndex: 0, setsConfig: {} }] });
      dispatchRef({ type: 'REMOVE_EXERCISE', payload: 0 });
    });
    expect(screen.getByTestId('exercises').textContent).toBe('0');
  });

  it('handles UPDATE_EXERCISE action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_EXERCISES', payload: [{ exerciseId: 'ex-1', orderIndex: 0, setsConfig: {} }] });
      dispatchRef({ type: 'UPDATE_EXERCISE', payload: { index: 0, exercise: { exerciseId: 'ex-2', orderIndex: 0, setsConfig: {} } } });
    });
  });

  it('handles REORDER_EXERCISES action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'ADD_EXERCISES', payload: [
        { exerciseId: 'ex-1', orderIndex: 0, setsConfig: {} },
        { exerciseId: 'ex-2', orderIndex: 1, setsConfig: {} },
      ]});
      dispatchRef({ type: 'REORDER_EXERCISES', payload: { from: 0, to: 1 } });
    });
  });

  it('handles SET_STEP action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_STEP', payload: 3 });
    });
    expect(screen.getByTestId('step').textContent).toBe('3');
  });

  it('clamps SET_STEP to valid range', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_STEP', payload: 99 });
    });
    expect(screen.getByTestId('step').textContent).toBe('5');

    act(() => {
      dispatchRef({ type: 'SET_STEP', payload: -5 });
    });
    expect(screen.getByTestId('step').textContent).toBe('1');
  });

  it('handles NEXT_STEP action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'NEXT_STEP' });
    });
    expect(screen.getByTestId('step').textContent).toBe('2');
  });

  it('handles PREV_STEP action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_STEP', payload: 3 });
    });
    act(() => {
      dispatchRef({ type: 'PREV_STEP' });
    });
    expect(screen.getByTestId('step').textContent).toBe('2');
  });

  it('does not go below step 1', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'PREV_STEP' });
    });
    expect(screen.getByTestId('step').textContent).toBe('1');
  });

  it('does not go above step 5', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_STEP', payload: 5 });
      dispatchRef({ type: 'NEXT_STEP' });
    });
    expect(screen.getByTestId('step').textContent).toBe('5');
  });

  it('handles SET_LOADING action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_LOADING', payload: true });
    });
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('handles SET_ERROR action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_ERROR', payload: { field: 'name', message: 'Required' } });
    });
    expect(screen.getByTestId('errors').textContent).toContain('name');
  });

  it('handles CLEAR_ERROR action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_ERROR', payload: { field: 'name', message: 'Required' } });
      dispatchRef({ type: 'CLEAR_ERROR', payload: 'name' });
    });
    expect(screen.getByTestId('errors').textContent).toBe('{}');
  });

  it('handles CLEAR_ALL_ERRORS action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_ERROR', payload: { field: 'name', message: 'Required' } });
      dispatchRef({ type: 'SET_ERROR', payload: { field: 'type', message: 'Required' } });
      dispatchRef({ type: 'CLEAR_ALL_ERRORS' });
    });
    expect(screen.getByTestId('errors').textContent).toBe('{}');
  });

  it('handles RESET_STATE action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'SET_BASIC_INFO', payload: { name: 'Test' } });
      dispatchRef({ type: 'RESET_STATE' });
    });
    expect(screen.getByTestId('name').textContent).toBe('');
  });

  it('handles LOAD_FROM_STORAGE action', () => {
    localStorage.setItem('programBuilderDraft', JSON.stringify({ name: 'Saved Program', currentStep: 2 }));
    renderWithProvider();
    // The useEffect triggers LOAD_FROM_STORAGE on mount
    expect(screen.getByTestId('name').textContent).toBe('Saved Program');
  });

  it('handles LOAD_FROM_STORAGE with invalid JSON', () => {
    localStorage.setItem('programBuilderDraft', 'invalid json');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProvider();
    // Should not crash
    expect(screen.getByTestId('name').textContent).toBe('');
    consoleError.mockRestore();
  });

  it('handles UPDATE_WEEKS action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    act(() => {
      dispatchRef({ type: 'UPDATE_WEEKS', payload: [{ weekNumber: 1, name: 'W1', workouts: [] }] });
    });
    expect(screen.getByTestId('weeks').textContent).toBe('1');
  });

  it('handles VALIDATE_CURRENT_STEP action', () => {
    let dispatchRef: any;
    renderWithProvider((state, dispatch) => { dispatchRef = dispatch; });

    // Step 1 requires name, programType, difficultyLevel
    act(() => {
      dispatchRef({ type: 'SET_BASIC_INFO', payload: {
        name: 'Test',
        programType: ProgramType.STRENGTH,
        difficultyLevel: DifficultyLevel.BEGINNER,
        durationWeeks: 4,
      }});
    });
    expect(screen.getByTestId('valid').textContent).toBe('true');
  });
});

describe('programBuilderHelpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toApiFormat converts state correctly', () => {
    const state = {
      name: '  My Program  ',
      description: '  Description  ',
      programType: ProgramType.STRENGTH,
      difficultyLevel: DifficultyLevel.BEGINNER,
      durationWeeks: 4,
      goals: ['Strength'],
      equipmentNeeded: ['Barbell'],
      weeks: [],
    } as any;

    const result = programBuilderHelpers.toApiFormat(state);
    expect(result.name).toBe('My Program');
    expect(result.description).toBe('Description');
    expect(result.goals).toEqual(['Strength']);
    expect(result.equipmentNeeded).toEqual(['Barbell']);
  });

  it('toApiFormat omits empty optional fields', () => {
    const state = {
      name: 'Test',
      description: '',
      programType: ProgramType.STRENGTH,
      difficultyLevel: DifficultyLevel.BEGINNER,
      durationWeeks: 4,
      goals: [],
      equipmentNeeded: [],
      weeks: [],
    } as any;

    const result = programBuilderHelpers.toApiFormat(state);
    expect(result.description).toBeUndefined();
    expect(result.goals).toBeUndefined();
    expect(result.equipmentNeeded).toBeUndefined();
  });

  it('clearDraft removes from localStorage', () => {
    localStorage.setItem('programBuilderDraft', 'test');
    programBuilderHelpers.clearDraft();
    expect(localStorage.getItem('programBuilderDraft')).toBeNull();
  });

  it('hasDraft returns true when draft exists', () => {
    localStorage.setItem('programBuilderDraft', 'test');
    expect(programBuilderHelpers.hasDraft()).toBe(true);
  });

  it('hasDraft returns false when no draft', () => {
    expect(programBuilderHelpers.hasDraft()).toBe(false);
  });

  it('getStepName returns correct names', () => {
    expect(programBuilderHelpers.getStepName(1)).toBe('Program Info');
    expect(programBuilderHelpers.getStepName(2)).toBe('Week Structure');
    expect(programBuilderHelpers.getStepName(3)).toBe('Workouts');
    expect(programBuilderHelpers.getStepName(4)).toBe('Exercises');
    expect(programBuilderHelpers.getStepName(5)).toBe('Preview');
    expect(programBuilderHelpers.getStepName(99)).toBe('Unknown');
  });
});
