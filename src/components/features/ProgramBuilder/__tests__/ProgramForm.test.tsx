/**
 * ProgramForm Component Tests
 * Story 005-01: Create New Program - Step 1: Basic Info
 *
 * Following Ralph Loop TDD: RED → GREEN → REFACTOR
 *
 * RED Phase: Write failing tests first
 */

import React, { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgramForm from '../ProgramForm';
import { ProgramBuilderProvider, useProgramBuilder } from '../ProgramBuilderContext';

// Helper to render component with provider and reset state
const renderWithProvider = (component: ReactNode) => {
  // Create a wrapper that resets state on mount
  const StateResetWrapper = ({ children }: { children: ReactNode }) => {
    const { dispatch } = useProgramBuilder();
    React.useEffect(() => {
      dispatch({ type: 'RESET_STATE' });
    }, [dispatch]);
    return <>{children}</>;
  };

  return render(
    <ProgramBuilderProvider>
      <StateResetWrapper>
        {component}
      </StateResetWrapper>
    </ProgramBuilderProvider>
  );
};

// Cleanup after all tests
afterAll(() => {
  cleanup();
});

describe('ProgramForm - Step 1: Basic Program Info', () => {
  // Cleanup after each test to prevent state pollution
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });
  describe('Required Fields', () => {
    it('should render program name input field', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
    });

    it('should render program type selector', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/program type/i)).toBeInTheDocument();
    });

    it('should render difficulty level selector', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/beginner/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/intermediate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/advanced/i)).toBeInTheDocument();
    });

    it('should render duration selector', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getAllByLabelText(/program duration/i)).toHaveLength(2); // Range slider + number input
    });
  });

  describe('Optional Fields', () => {
    it('should render description textarea', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render goals input section', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/goals/i)).toBeInTheDocument();
    });

    it('should render equipment selector', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/equipment/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when program name is empty on submit', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<ProgramForm onNext={handleNext} onPrev={jest.fn()} />);

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      // Should show validation error
      expect(screen.getByText(/program name is required/i)).toBeInTheDocument();
      expect(handleNext).not.toHaveBeenCalled();
    });

    it('should show validation error when program type is not selected', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<ProgramForm onNext={handleNext} onPrev={jest.fn()} />);

      // Fill name but not type
      await user.type(screen.getByLabelText(/program name/i), 'Test Program');
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      expect(screen.getByText(/program type is required/i)).toBeInTheDocument();
      expect(handleNext).not.toHaveBeenCalled();
    });

    it('should show validation error when difficulty level is not selected', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<ProgramForm onNext={handleNext} onPrev={jest.fn()} />);

      // Fill name and type but not difficulty
      await user.type(screen.getByLabelText(/program name/i), 'Test Program');
      await user.selectOptions(screen.getByLabelText(/program type/i), 'strength');
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      expect(screen.getByText(/difficulty level is required/i)).toBeInTheDocument();
      expect(handleNext).not.toHaveBeenCalled();
    });

    it('should call onNext when all required fields are filled', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<ProgramForm onNext={handleNext} onPrev={jest.fn()} />);

      // Fill all required fields
      await user.type(screen.getByLabelText(/program name/i), '12-Week Strength Program');
      await user.selectOptions(screen.getByLabelText(/program type/i), 'strength');
      // Click on the Intermediate radio button for difficulty
      await user.click(screen.getByLabelText(/intermediate/i));
      // Duration is already set to default value (4 weeks), so we don't need to change it

      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      // Should proceed without errors
      expect(handleNext).toHaveBeenCalled();
    });
  });

  describe('Goals Management', () => {
    it('should allow adding a goal', async () => {
      const user = userEvent.setup();

      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Type a goal and press Enter
      const goalInput = screen.getByPlaceholderText(/add a goal/i);
      await user.type(goalInput, 'Build muscle{enter}');

      expect(screen.getByText('Build muscle')).toBeInTheDocument();
    });

    it('should allow removing a goal', async () => {
      const user = userEvent.setup();

      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Add a goal
      const goalInput = screen.getByPlaceholderText(/add a goal/i);
      await user.type(goalInput, 'Build muscle{enter}');

      // Remove it
      const removeButton = screen.getByRole('button', { name: /remove.*build muscle/i });
      await user.click(removeButton);

      expect(screen.queryByText('Build muscle')).not.toBeInTheDocument();
    });

    it('should not add empty goals', async () => {
      const user = userEvent.setup();

      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      const goalInput = screen.getByPlaceholderText(/add a goal/i);
      await user.type(goalInput, '{enter}');

      // Should not add empty goal
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('Equipment Selection', () => {
    it('should render equipment options', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Common equipment should be shown
      expect(screen.getByText(/barbell/i)).toBeInTheDocument();
      expect(screen.getByText(/dumbbells/i)).toBeInTheDocument();
    });

    it('should allow selecting multiple equipment items', async () => {
      const user = userEvent.setup();

      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Select equipment
      await user.click(screen.getByRole('checkbox', { name: /barbell/i }));
      await user.click(screen.getByRole('checkbox', { name: /dumbbells/i }));

      expect(screen.getByRole('checkbox', { name: /barbell/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /dumbbells/i })).toBeChecked();
    });
  });

  describe('Form State Management', () => {
    it('should update program builder state when form fields change', async () => {
      const user = userEvent.setup();

      const { container } = renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Wait for component to be fully rendered
      await waitFor(() => {
        expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
      });

      // Type program name - clear first to ensure clean state
      const nameInput = screen.getByLabelText(/program name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'My Custom Program');
      expect(nameInput).toHaveValue('My Custom Program');

      // Select program type
      await user.selectOptions(screen.getByLabelText(/program type/i), 'hypertrophy');
      expect(screen.getByLabelText(/program type/i)).toHaveValue('hypertrophy');
    });
  });

  describe('Navigation', () => {
    it('should have a Next Step button', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
    });

    it('should call onNext when form is valid and button is clicked', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<ProgramForm onNext={handleNext} onPrev={jest.fn()} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/program name/i), 'Test Program');
      await user.selectOptions(screen.getByLabelText(/program type/i), 'strength');
      await user.click(screen.getByLabelText(/beginner/i));

      // Click Next button
      const nextButton = screen.getByRole('button', { name: /next step/i });
      await user.click(nextButton);

      expect(handleNext).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/program type/i)).toBeInTheDocument();
      // Difficulty level is in a fieldset with legend
      expect(screen.getByText(/difficulty level/i)).toBeInTheDocument();
      // Duration has two inputs (range + number) with the same label
      expect(screen.getAllByLabelText(/program duration/i)).toHaveLength(2);
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/program goals/i)).toBeInTheDocument();
    });

    it('should allow keyboard navigation through form fields', async () => {
      const user = userEvent.setup();

      renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

      // Tab through fields
      await user.tab();
      expect(screen.getByLabelText(/program name/i)).toHaveFocus();

      await user.tab();
      // Should move to next field
    });
  });
});
