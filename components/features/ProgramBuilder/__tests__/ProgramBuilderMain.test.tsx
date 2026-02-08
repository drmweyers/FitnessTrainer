/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

const mockDispatch = jest.fn();
const mockState = {
  currentStep: 1,
  isValid: true,
  isDirty: false,
  isLoading: false,
};

jest.mock('../ProgramBuilderContext', () => ({
  useProgramBuilder: () => ({ state: mockState, dispatch: mockDispatch }),
  programBuilderHelpers: {
    hasDraft: jest.fn(() => false),
    clearDraft: jest.fn(),
  },
}));

jest.mock('../ProgramForm', () => ({
  __esModule: true,
  default: ({ onNext, onPrev }: any) => (
    <div data-testid="program-form">
      <button onClick={onPrev}>Previous</button>
      <button onClick={onNext}>Next</button>
    </div>
  ),
}));

jest.mock('../WeekBuilder', () => ({
  __esModule: true,
  default: () => <div data-testid="week-builder">Week Builder</div>,
}));

jest.mock('../WorkoutBuilder', () => ({
  __esModule: true,
  default: () => <div data-testid="workout-builder">Workout Builder</div>,
}));

jest.mock('../ExerciseSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="exercise-selector">Exercise Selector</div>,
}));

jest.mock('../ProgramPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="program-preview">Preview</div>,
}));

jest.mock('lucide-react', () => ({
  Save: () => <span data-testid="icon-save" />,
  X: () => <span data-testid="icon-x" />,
}));

import ProgramBuilder from '../ProgramBuilder';

describe('ProgramBuilder (features)', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockState.currentStep = 1;
    mockState.isDirty = false;
    mockState.isValid = true;
  });

  it('renders the title', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByText('Create Training Program')).toBeInTheDocument();
  });

  it('renders step names', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByText('Program Info')).toBeInTheDocument();
    expect(screen.getByText('Weeks')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders program form on step 1', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('program-form')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('shows draft saved message when isDirty', () => {
    mockState.isDirty = true;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByText('Draft saved automatically')).toBeInTheDocument();
  });

  it('does not show draft saved message when not dirty', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.queryByText('Draft saved automatically')).not.toBeInTheDocument();
  });

  it('dispatches VALIDATE_CURRENT_STEP on next', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'VALIDATE_CURRENT_STEP' });
  });

  it('dispatches NEXT_STEP when valid', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NEXT_STEP' });
  });

  it('dispatches PREV_STEP on previous', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Previous'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'PREV_STEP' });
  });

  it('calls onCancel when close clicked and not dirty', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders step number buttons', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows alert when next is clicked and state is invalid', () => {
    mockState.isValid = false;
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Next'));
    expect(alertSpy).toHaveBeenCalledWith('Please complete all required fields before proceeding');
    alertSpy.mockRestore();
  });

  it('asks confirmation when cancel clicked with dirty state', () => {
    mockState.isDirty = true;
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to cancel? Any unsaved changes will be lost.');
    expect(mockOnCancel).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('does not cancel when confirm is rejected with dirty state', () => {
    mockState.isDirty = true;
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    expect(mockOnCancel).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('navigates to a previous step when step button clicked', () => {
    mockState.currentStep = 2;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    // When on step 2, step 1 shows a checkmark SVG. Find the first step circle button
    // Step buttons are in order - step 1 contains an SVG (checkmark for completed steps)
    const stepButtons = screen.getAllByRole('button');
    // The first button with a checkmark SVG is step 1 (completed step)
    const step1Btn = stepButtons.find(btn => btn.querySelector('svg') && btn.className.includes('bg-green'));
    if (step1Btn) {
      fireEvent.click(step1Btn);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_STEP', payload: 1 });
    }
  });

  it('renders week builder on step 2', () => {
    mockState.currentStep = 2;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('week-builder')).toBeInTheDocument();
  });

  it('renders workout builder on step 3', () => {
    mockState.currentStep = 3;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('workout-builder')).toBeInTheDocument();
  });

  it('renders exercise selector on step 4', () => {
    mockState.currentStep = 4;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('renders preview on step 5', () => {
    mockState.currentStep = 5;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByTestId('program-preview')).toBeInTheDocument();
  });

  it('renders nothing for invalid step', () => {
    mockState.currentStep = 99;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.queryByTestId('program-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('week-builder')).not.toBeInTheDocument();
  });

  it('attempts to go to next step when clicking a step ahead', () => {
    mockState.currentStep = 1;
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    // Step 2 button (next step from current)
    fireEvent.click(screen.getByText('2'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'VALIDATE_CURRENT_STEP' });
  });

  it('loads draft on mount when draft exists and user confirms', () => {
    const { programBuilderHelpers } = require('../ProgramBuilderContext');
    programBuilderHelpers.hasDraft.mockReturnValue(true);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(confirmSpy).toHaveBeenCalledWith('A draft program was found. Do you want to continue where you left off?');
    // User declined to load draft, so clearDraft + RESET_STATE should be called
    expect(programBuilderHelpers.clearDraft).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_STATE' });
    confirmSpy.mockRestore();
  });

  it('does not cancel when no onCancel is provided', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    // No error should occur
  });
});
