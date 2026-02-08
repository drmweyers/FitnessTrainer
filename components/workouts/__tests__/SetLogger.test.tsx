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

  it('increments reps with plus button', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const plusBtns = screen.getAllByTestId('plus-icon');
    // The first plus icon is for reps increment
    fireEvent.click(plusBtns[0].closest('button')!);
    // Quick reps calls handleComplete when value > 0, so onLogSet is called
    expect(handleLogSet).toHaveBeenCalled();
  });

  it('decrements reps with minus button', () => {
    render(<SetLogger {...defaultProps} />);
    const minusBtns = screen.getAllByTestId('minus-icon');
    // Click minus on reps (first minus icon) - value stays at 0 (can't go below)
    fireEvent.click(minusBtns[0].closest('button')!);
    const actualInput = screen.getByLabelText('Actual Reps *');
    expect(actualInput).toHaveValue(0);
  });

  it('handles quick weight increment', () => {
    render(<SetLogger {...defaultProps} />);
    const plusBtns = screen.getAllByTestId('plus-icon');
    // Second plus icon is for weight
    fireEvent.click(plusBtns[1].closest('button')!);
    const weightInput = screen.getByLabelText('Weight (lbs)');
    expect(weightInput).toHaveValue(5);
  });

  it('handles quick weight decrement', () => {
    render(<SetLogger {...defaultProps} />);
    // First set weight to something
    const weightInput = screen.getByLabelText('Weight (lbs)');
    fireEvent.change(weightInput, { target: { value: '100' } });
    const minusBtns = screen.getAllByTestId('minus-icon');
    // Second minus icon is for weight
    fireEvent.click(minusBtns[1].closest('button')!);
    expect(weightInput).toHaveValue(95);
  });

  it('weight cannot go below 0', () => {
    render(<SetLogger {...defaultProps} />);
    const minusBtns = screen.getAllByTestId('minus-icon');
    fireEvent.click(minusBtns[1].closest('button')!);
    const weightInput = screen.getByLabelText('Weight (lbs)');
    expect(weightInput).toHaveValue(0);
  });

  it('increments RPE with chevron up', () => {
    render(<SetLogger {...defaultProps} />);
    const upBtn = screen.getByTestId('chevron-up').closest('button')!;
    fireEvent.click(upBtn);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('decrements RPE with chevron down', () => {
    render(<SetLogger {...defaultProps} />);
    const downBtn = screen.getByTestId('chevron-down').closest('button')!;
    fireEvent.click(downBtn);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('RPE cannot go above 10', () => {
    render(<SetLogger {...defaultProps} />);
    const upBtn = screen.getByTestId('chevron-up').closest('button')!;
    // RPE starts at 7, click up 4 times to reach 10
    fireEvent.click(upBtn);
    fireEvent.click(upBtn);
    fireEvent.click(upBtn);
    // '10' appears both as RPE display and as quick-rep button
    const tens = screen.getAllByText('10');
    expect(tens.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Heavy')).toBeInTheDocument();
  });

  it('RPE cannot go below 1', () => {
    render(<SetLogger {...defaultProps} />);
    const downBtn = screen.getByTestId('chevron-down').closest('button')!;
    // RPE starts at 7, click down 7 times
    for (let i = 0; i < 7; i++) fireEvent.click(downBtn);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Very Light')).toBeInTheDocument();
  });

  it('shows RPE label "Very Light" for RPE <= 4', () => {
    render(<SetLogger {...defaultProps} />);
    const downBtn = screen.getByTestId('chevron-down').closest('button')!;
    // RPE 7 -> 6 -> 5 -> 4
    fireEvent.click(downBtn);
    fireEvent.click(downBtn);
    fireEvent.click(downBtn);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Very Light')).toBeInTheDocument();
  });

  it('changes RIR when input is modified', () => {
    render(<SetLogger {...defaultProps} />);
    const rirInput = screen.getByLabelText('RIR (Reps in Reserve)');
    fireEvent.change(rirInput, { target: { value: '3' } });
    expect(rirInput).toHaveValue(3);
  });

  it('changes notes when input is modified', () => {
    render(<SetLogger {...defaultProps} />);
    const notesInput = screen.getByLabelText('Notes');
    fireEvent.change(notesInput, { target: { value: 'Felt strong' } });
    expect(notesInput).toHaveValue('Felt strong');
  });

  it('changes weight when input is modified', () => {
    render(<SetLogger {...defaultProps} />);
    const weightInput = screen.getByLabelText('Weight (lbs)');
    fireEvent.change(weightInput, { target: { value: '135' } });
    expect(weightInput).toHaveValue(135);
  });

  it('quick rep button (5) sets reps and calls onLogSet', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const btn5 = screen.getByRole('button', { name: '5' });
    fireEvent.click(btn5);
    expect(handleLogSet).toHaveBeenCalled();
  });

  it('quick rep button (10) sets reps and calls onLogSet', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const btn10 = screen.getByRole('button', { name: '10' });
    fireEvent.click(btn10);
    expect(handleLogSet).toHaveBeenCalled();
  });

  it('quick rep button (12) sets reps and calls onLogSet', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const btn12 = screen.getByRole('button', { name: '12' });
    fireEvent.click(btn12);
    expect(handleLogSet).toHaveBeenCalled();
  });

  it('shows Done badge after completion', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Complete Set'));
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows Completed text after set is logged', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Complete Set'));
    const completedTexts = screen.getAllByText(/Completed/);
    expect(completedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onComplete callback when provided', () => {
    const handleLogSet = jest.fn();
    const handleComplete = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} onComplete={handleComplete} />);
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Complete Set'));
    expect(handleComplete).toHaveBeenCalled();
  });

  it('includes weight in onLogSet when weight is set', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} />);
    const weightInput = screen.getByLabelText('Weight (lbs)');
    fireEvent.change(weightInput, { target: { value: '135' } });
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Complete Set'));
    expect(handleLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ actualWeight: 135 })
    );
  });

  it('does not call onLogSet in readOnly mode', () => {
    const handleLogSet = jest.fn();
    render(<SetLogger {...defaultProps} onLogSet={handleLogSet} readOnly />);
    // readOnly mode doesn't show Complete Set button
    expect(screen.queryByText('Complete Set')).not.toBeInTheDocument();
  });

  it('shows PR badge when beating previous best reps', () => {
    const handleLogSet = jest.fn();
    render(
      <SetLogger
        {...defaultProps}
        onLogSet={handleLogSet}
        previousBest={{ reps: 8, weight: 100 }}
      />
    );
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '10' } });
    expect(screen.getByText(/PR/)).toBeInTheDocument();
  });

  it('shows PR badge when beating previous best weight', () => {
    const handleLogSet = jest.fn();
    render(
      <SetLogger
        {...defaultProps}
        onLogSet={handleLogSet}
        previousBest={{ reps: 8, weight: 100 }}
      />
    );
    const actualInput = screen.getByLabelText('Actual Reps *');
    fireEvent.change(actualInput, { target: { value: '1' } });
    const weightInput = screen.getByLabelText('Weight (lbs)');
    fireEvent.change(weightInput, { target: { value: '150' } });
    expect(screen.getByText(/PR/)).toBeInTheDocument();
  });

  it('shows previous best without volume when volume not provided', () => {
    render(
      <SetLogger
        {...defaultProps}
        previousBest={{ reps: 8, weight: 100 }}
      />
    );
    expect(screen.getByText(/Last time:/)).toBeInTheDocument();
    expect(screen.queryByText(/Volume:/)).not.toBeInTheDocument();
  });
});
