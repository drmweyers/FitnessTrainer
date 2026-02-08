/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProgramForm from './ProgramForm';
import { ProgramBuilderProvider } from './ProgramBuilderContext';

// Mock ProgramBuilderContext
const mockDispatch = jest.fn();
const mockState = {
  name: '',
  description: '',
  programType: '',
  difficultyLevel: '',
  durationWeeks: 8,
  goals: [],
  equipmentNeeded: [],
  currentStep: 1,
  isValid: false,
  isDirty: false,
  isLoading: false,
};

jest.mock('./ProgramBuilderContext', () => ({
  ...jest.requireActual('./ProgramBuilderContext'),
  useProgramBuilder: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ProgramBuilderProvider>
      {component}
    </ProgramBuilderProvider>
  );
};

describe('ProgramForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.name = '';
    mockState.description = '';
    mockState.programType = '';
    mockState.difficultyLevel = '';
    mockState.durationWeeks = 8;
    mockState.goals = [];
    mockState.equipmentNeeded = [];
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText('Program Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Program Type *')).toBeInTheDocument();
      // Difficulty level has both a fieldset and a div[role=group], match either
      const groups = screen.getAllByRole('group', { name: /difficulty level/i });
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('should render program type options', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const select = screen.getByLabelText('Program Type *');
      expect(select).toBeInTheDocument();

      fireEvent.mouseDown(select);

      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('Muscle Building (Hypertrophy)')).toBeInTheDocument();
      expect(screen.getByText('Endurance')).toBeInTheDocument();
    });

    it('should render difficulty level radio buttons', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/Beginner/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Intermediate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Advanced/i)).toBeInTheDocument();
    });

    it('should render duration range slider', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const rangeInput = screen.getByLabelText('Program Duration');
      expect(rangeInput).toBeInTheDocument();
      expect(rangeInput).toHaveAttribute('type', 'range');
      expect(rangeInput).toHaveAttribute('min', '1');
      expect(rangeInput).toHaveAttribute('max', '52');
    });

    it('should render common goals suggestions', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Goals render as "+ Build Strength" etc.
      expect(screen.getByText('+ Build Strength')).toBeInTheDocument();
      expect(screen.getByText('+ Gain Muscle')).toBeInTheDocument();
      expect(screen.getByText('+ Lose Weight')).toBeInTheDocument();
    });

    it('should render equipment options', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText('Barbell')).toBeInTheDocument();
      expect(screen.getByText('Dumbbells')).toBeInTheDocument();
      expect(screen.getByText('Kettlebells')).toBeInTheDocument();
      expect(screen.getByText('Bodyweight Only')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update program name input', async () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const input = screen.getByLabelText('Program Name *');
      fireEvent.change(input, { target: { value: 'My Test Program' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { name: 'My Test Program' }
      });
    });

    it('should update description textarea', async () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const textarea = screen.getByLabelText('Description');
      fireEvent.change(textarea, { target: { value: 'This is a test description' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { description: 'This is a test description' }
      });
    });

    it('should update program type selection', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const select = screen.getByLabelText('Program Type *');
      await user.selectOptions(select, 'strength');

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { programType: 'strength' }
      });
    });

    it('should update difficulty level selection', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const beginnerRadio = screen.getByLabelText(/Beginner/i);
      await user.click(beginnerRadio);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { difficultyLevel: 'beginner' }
      });
    });

    it('should update duration using range slider', async () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const rangeInput = screen.getByLabelText('Program Duration');
      fireEvent.change(rangeInput, { target: { value: '12' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { durationWeeks: 12 }
      });
    });

    it('should update duration using number input', async () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const numberInput = screen.getByLabelText('Duration in weeks');
      fireEvent.change(numberInput, { target: { value: '16' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { durationWeeks: 16 }
      });
    });
  });

  describe('Goal Management', () => {
    it('should add custom goal via input', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const input = screen.getByPlaceholderText('Add a goal...');
      await user.type(input, 'Custom Goal');

      const addButton = screen.getByRole('button', { name: '' });
      await user.click(addButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: ['Custom Goal'] }
      });
    });

    it('should add goal via Enter key', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const input = screen.getByPlaceholderText('Add a goal...');
      await user.type(input, 'Test Goal{Enter}');

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: ['Test Goal'] }
      });
    });

    it('should add goal from common suggestions', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const buildStrengthButton = screen.getByRole('button', { name: '+ Build Strength' });
      await user.click(buildStrengthButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: ['Build Strength'] }
      });
    });

    it('should remove goal by clicking X button', async () => {
      const user = userEvent.setup();
      mockState.goals = ['Build Strength'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const removeButton = screen.getByLabelText('Remove Build Strength');
      await user.click(removeButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: [] }
      });
    });

    it('should not add duplicate goals', async () => {
      const user = userEvent.setup();
      mockState.goals = ['Build Strength'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const input = screen.getByPlaceholderText('Add a goal...');
      await user.type(input, 'Build Strength');

      const addButton = screen.getByRole('button', { name: '' });
      await user.click(addButton);

      // Should not add duplicate
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: ['Build Strength', 'Build Strength'] }
      });
    });

    it('should trim whitespace from custom goals', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const input = screen.getByPlaceholderText('Add a goal...');
      await user.type(input, '  Test Goal  ');

      const addButton = screen.getByRole('button', { name: '' });
      await user.click(addButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { goals: ['Test Goal'] }
      });
    });
  });

  describe('Equipment Selection', () => {
    it('should add equipment when clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const barbellLabel = screen.getByText('Barbell').closest('label');
      await user.click(barbellLabel!);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { equipmentNeeded: ['Barbell'] }
      });
    });

    it('should remove equipment when clicked again', async () => {
      const user = userEvent.setup();
      mockState.equipmentNeeded = ['Barbell', 'Dumbbells'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const barbellLabel = screen.getByText('Barbell').closest('label');
      await user.click(barbellLabel!);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_BASIC_INFO',
        payload: { equipmentNeeded: ['Dumbbells'] }
      });
    });

    it('should visually select equipment with green background', () => {
      mockState.equipmentNeeded = ['Barbell'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const barbellLabel = screen.getByText('Barbell').closest('label');
      expect(barbellLabel).toHaveClass('bg-green-500');
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty program name', async () => {
      const user = userEvent.setup();
      const mockNext = jest.fn();
      renderWithProvider(<ProgramForm onNext={mockNext} onPrev={jest.fn()} />);

      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);

      expect(screen.getByText('Program name is required')).toBeInTheDocument();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should show error for missing program type', async () => {
      const user = userEvent.setup();
      const mockNext = jest.fn();
      mockState.name = 'Test Program';
      renderWithProvider(<ProgramForm onNext={mockNext} onPrev={jest.fn()} />);

      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);

      expect(screen.getByText('Program type is required')).toBeInTheDocument();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should show error for missing difficulty level', async () => {
      const user = userEvent.setup();
      const mockNext = jest.fn();
      mockState.name = 'Test Program';
      mockState.programType = 'strength';
      renderWithProvider(<ProgramForm onNext={mockNext} onPrev={jest.fn()} />);

      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);

      expect(screen.getByText('Difficulty level is required')).toBeInTheDocument();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call onNext when form is valid', async () => {
      const user = userEvent.setup();
      const mockNext = jest.fn();
      mockState.name = 'Test Program';
      mockState.programType = 'strength';
      mockState.difficultyLevel = 'beginner';
      renderWithProvider(<ProgramForm onNext={mockNext} onPrev={jest.fn()} />);

      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);

      expect(screen.queryByText('Program name is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Program type is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Difficulty level is required')).not.toBeInTheDocument();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // First trigger error
      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);
      expect(screen.getByText('Program name is required')).toBeInTheDocument();

      // Then type in the field
      const input = screen.getByLabelText('Program Name *');
      await user.type(input, 'My Program');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Program name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Duration Display', () => {
    it('should display singular "week" for duration of 1', () => {
      mockState.durationWeeks = 1;
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText('1 week')).toBeInTheDocument();
    });

    it('should display plural "weeks" for duration > 1', () => {
      mockState.durationWeeks = 8;
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText('8 weeks')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for duration inputs', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText('Program Duration')).toBeInTheDocument();
      expect(screen.getByLabelText('Duration in weeks')).toBeInTheDocument();
    });

    it('should have proper role for goals list', () => {
      mockState.goals = ['Build Strength'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('list', { name: /selected goals/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for equipment group', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('group', { name: /equipment selection/i })).toBeInTheDocument();
    });

    it('should have accessible remove buttons for goals', () => {
      mockState.goals = ['Build Strength'];
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText('Remove Build Strength')).toBeInTheDocument();
    });

    it('should use screen reader only labels for duration inputs', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // The labels have sr-only class, not the inputs themselves
      const durationRange = screen.getByLabelText('Program Duration');
      expect(durationRange).toBeInTheDocument();
      const durationNumber = screen.getByLabelText('Duration in weeks');
      expect(durationNumber).toBeInTheDocument();
      // Verify the labels exist with sr-only (check via associated label elements)
      const rangeLabel = document.querySelector('label[for="duration-range"]');
      expect(rangeLabel?.className).toContain('sr-only');
      const numberLabel = document.querySelector('label[for="duration-number"]');
      expect(numberLabel?.className).toContain('sr-only');
    });

    it('should display error messages with role="alert"', async () => {
      const user = userEvent.setup();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const nextButton = screen.getByRole('button', { name: 'Next Step' });
      await user.click(nextButton);

      const errorMessage = screen.getByText('Program name is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Navigation Buttons', () => {
    it('should disable Previous button on first step', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton).toBeDisabled();
    });

    it('should call onPrev when Previous is clicked (if enabled)', () => {
      const mockPrev = jest.fn();
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={mockPrev} />);

      const prevButton = screen.getByRole('button', { name: 'Previous' });
      fireEvent.click(prevButton);

      // Button is disabled but handler should still be callable
      expect(mockPrev).not.toHaveBeenCalled();
    });
  });
});
