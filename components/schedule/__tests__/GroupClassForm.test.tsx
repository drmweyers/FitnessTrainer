/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GroupClassForm from '../GroupClassForm';

jest.mock('lucide-react', () => ({
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

describe('GroupClassForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all group class form fields', () => {
    render(<GroupClassForm {...defaultProps} />);

    expect(screen.getByLabelText(/class name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max participants/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open for registration/i)).toBeInTheDocument();
  });

  it('has default max participants of 10', () => {
    render(<GroupClassForm {...defaultProps} />);

    const maxParticipantsInput = screen.getByLabelText(/max participants/i);
    expect(maxParticipantsInput).toHaveValue(10);
  });

  it('shows current participants as read-only when provided', () => {
    render(<GroupClassForm {...defaultProps} currentParticipants={5} />);

    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/current participants/i)).toBeInTheDocument();
  });

  it('does not show current participants when not provided', () => {
    render(<GroupClassForm {...defaultProps} />);

    expect(screen.queryByText(/current participants/i)).not.toBeInTheDocument();
  });

  it('validates that class name is required', async () => {
    render(<GroupClassForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /create class/i }));

    await waitFor(() => {
      expect(screen.getByText(/class name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates max participants must be at least 1', async () => {
    render(<GroupClassForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/class name/i), {
      target: { value: 'Morning Yoga' },
    });
    fireEvent.change(screen.getByLabelText(/max participants/i), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create class/i }));

    await waitFor(() => {
      expect(screen.getByText(/must have at least 1 participant/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<GroupClassForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/class name/i), {
      target: { value: 'Morning Yoga' },
    });
    fireEvent.change(screen.getByLabelText(/max participants/i), {
      target: { value: '15' },
    });

    const toggle = screen.getByRole('checkbox', { name: /open for registration/i });
    fireEvent.click(toggle);

    fireEvent.click(screen.getByRole('button', { name: /create class/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'Morning Yoga',
          maxParticipants: 15,
          isOpenForRegistration: true,
        })
      );
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<GroupClassForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('toggles open for registration checkbox', () => {
    render(<GroupClassForm {...defaultProps} />);

    const toggle = screen.getByRole('checkbox', { name: /open for registration/i });

    // Default state - unchecked
    expect(toggle).not.toBeChecked();

    // After click - checked
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    // After second click - unchecked
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('pre-fills form with initialValues', () => {
    render(
      <GroupClassForm
        {...defaultProps}
        initialValues={{
          className: 'HIIT Bootcamp',
          maxParticipants: 20,
          isOpenForRegistration: true,
        }}
      />
    );

    const classNameInput = screen.getByLabelText(/class name/i) as HTMLInputElement;
    const maxParticipantsInput = screen.getByLabelText(/max participants/i) as HTMLInputElement;
    const toggle = screen.getByRole('checkbox', { name: /open for registration/i }) as HTMLInputElement;

    expect(classNameInput.value).toBe('HIIT Bootcamp');
    expect(parseInt(maxParticipantsInput.value)).toBe(20);
    expect(toggle.checked).toBe(true);
  });

  it('clears className error when user types in the class name field', async () => {
    render(<GroupClassForm {...defaultProps} />);

    // Submit to trigger error
    fireEvent.click(screen.getByRole('button', { name: /create class/i }));
    await waitFor(() => {
      expect(screen.getByText(/class name is required/i)).toBeInTheDocument();
    });

    // Type in class name field - error should clear
    fireEvent.change(screen.getByLabelText(/class name/i), {
      target: { value: 'Morning Yoga' },
    });

    await waitFor(() => {
      expect(screen.queryByText(/class name is required/i)).not.toBeInTheDocument();
    });
  });

  it('clears maxParticipants error when user updates the field', async () => {
    render(<GroupClassForm {...defaultProps} />);

    // Set class name, then set invalid max participants
    fireEvent.change(screen.getByLabelText(/class name/i), {
      target: { value: 'Morning Yoga' },
    });
    fireEvent.change(screen.getByLabelText(/max participants/i), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create class/i }));
    await waitFor(() => {
      expect(screen.getByText(/must have at least 1 participant/i)).toBeInTheDocument();
    });

    // Fix the value - error should clear
    fireEvent.change(screen.getByLabelText(/max participants/i), {
      target: { value: '5' },
    });

    await waitFor(() => {
      expect(screen.queryByText(/must have at least 1 participant/i)).not.toBeInTheDocument();
    });
  });

  it('trims whitespace from class name on submit', async () => {
    render(<GroupClassForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/class name/i), {
      target: { value: '  Morning Yoga  ' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create class/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ className: 'Morning Yoga' })
      );
    });
  });
});
