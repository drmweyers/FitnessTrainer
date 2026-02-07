/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SetLogger } from '../SetLogger';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Minus: () => <span data-testid="minus-icon" />,
  Check: () => <span data-testid="check-icon" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
}));

describe('SetLogger', () => {
  const defaultProps = {
    exerciseId: 'ex-1',
    exerciseName: 'Bench Press',
    setNumber: 1,
    onLogSet: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('renders target reps input with default value', () => {
    render(<SetLogger {...defaultProps} />);
    const targetInput = screen.getByLabelText('Target Reps');
    expect(targetInput).toHaveValue('8-12');
  });

  it('renders actual reps input starting at 0', () => {
    render(<SetLogger {...defaultProps} />);
    const actualInput = screen.getByLabelText('Actual Reps *');
    expect(actualInput).toHaveValue(0);
  });

  it('renders weight input', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument();
  });

  it('renders RPE display with default value of 7', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('renders RIR input with default value of 2', () => {
    render(<SetLogger {...defaultProps} />);
    const rirInput = screen.getByLabelText('RIR (Reps in Reserve)');
    expect(rirInput).toHaveValue(2);
  });

  it('renders notes input', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('renders Complete Set button when not readOnly', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByText('Complete Set')).toBeInTheDocument();
  });

  it('does not render Complete Set button when readOnly', () => {
    render(<SetLogger {...defaultProps} readOnly />);
    expect(screen.queryByText('Complete Set')).not.toBeInTheDocument();
  });

  it('shows quick rep buttons (5, 10, 12)', () => {
    render(<SetLogger {...defaultProps} />);
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12' })).toBeInTheDocument();
  });

  it('shows previous best when provided', () => {
    const props = {
      ...defaultProps,
      previousBest: {
        reps: 10,
        weight: 135,
        volume: '1350 lbs',
      },
    };

    render(<SetLogger {...props} />);
    expect(screen.getByText(/Last time:/)).toBeInTheDocument();
    expect(screen.getByText(/10 reps @ 135/)).toBeInTheDocument();
    expect(screen.getByText(/1350 lbs/)).toBeInTheDocument();
  });

  it('calls onLogSet when Complete Set is clicked with valid reps', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);

    // Set actual reps
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '10' } });

    // Click complete
    const completeBtn = screen.getByText('Complete Set');
    fireEvent.click(completeBtn);

    expect(handleLogSet).toHaveBeenCalledWith(
      expect.objectContaining({
        exerciseId: 'ex-1',
        setNumber: 1,
        setType: 'working',
        targetReps: '8-12',
        actualReps: 10,
        rpe: 7,
        rir: 2,
      })
    );
  });

  it('disables Complete Set button when actualReps is 0', () => {
    render(<SetLogger {...defaultProps} />);
    const completeBtn = screen.getByText('Complete Set');
    expect(completeBtn).toBeDisabled();
  });

  it('changes target reps when input is modified', () => {
    render(<SetLogger {...defaultProps} />);
    const targetInput = screen.getByLabelText('Target Reps');
    fireEvent.change(targetInput, { target: { value: '5-8' } });
    expect(targetInput).toHaveValue('5-8');
  });
});
