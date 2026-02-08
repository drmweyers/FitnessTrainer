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
});
