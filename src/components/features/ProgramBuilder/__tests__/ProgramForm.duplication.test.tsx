/**
 * Test for input duplication bug
 * Story 005-01: Create New Program
 */

import React, { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgramForm from '../ProgramForm';
import { ProgramBuilderProvider, useProgramBuilder } from '../ProgramBuilderContext';

const renderWithProvider = (component: ReactNode) => {
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

describe('ProgramForm - Input Duplication Bug', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should not duplicate input values when typing', async () => {
    const user = userEvent.setup();

    renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

    // Wait for component to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
    });

    // Type program name character by character
    const nameInput = screen.getByLabelText(/program name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Test Program');

    // Check that the value is exactly what we typed
    expect(nameInput).toHaveValue('Test Program');
    
    // Verify it's not duplicated
    expect(nameInput).not.toHaveValue('Test ProgramTest Program');
    expect(nameInput).not.toHaveValue('Test ProgramTest Program12-Week Strength ProgramTest Program');
  });

  it('should handle multiple rapid changes without duplication', async () => {
    const user = userEvent.setup();

    renderWithProvider(<ProgramForm onNext={jest.fn()} onPrev={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/program name/i);
    await user.clear(nameInput);
    
    // Type multiple values in sequence
    await user.type(nameInput, 'First');
    expect(nameInput).toHaveValue('First');
    
    await user.clear(nameInput);
    await user.type(nameInput, 'Second');
    expect(nameInput).toHaveValue('Second');
    
    await user.clear(nameInput);
    await user.type(nameInput, 'Third');
    expect(nameInput).toHaveValue('Third');
  });
});
