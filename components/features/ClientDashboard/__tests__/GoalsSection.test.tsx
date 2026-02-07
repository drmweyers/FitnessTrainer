/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="icon-check" />,
  Circle: () => <span data-testid="icon-circle" />,
  Plus: () => <span data-testid="icon-plus" />,
  Target: () => <span data-testid="icon-target" />,
}));

import GoalsSection from '../GoalsSection';

describe('GoalsSection', () => {
  const mockGoals = [
    { id: '1', text: 'Lose 10 pounds', completed: true },
    { id: '2', text: 'Run a 5K', completed: false },
    { id: '3', text: 'Bench press 200 lbs', completed: false },
  ];

  it('should render section title', () => {
    render(<GoalsSection goals={mockGoals} />);
    expect(screen.getByText('Client Goals')).toBeInTheDocument();
  });

  it('should render all goals', () => {
    render(<GoalsSection goals={mockGoals} />);
    expect(screen.getByText('Lose 10 pounds')).toBeInTheDocument();
    expect(screen.getByText('Run a 5K')).toBeInTheDocument();
    expect(screen.getByText('Bench press 200 lbs')).toBeInTheDocument();
  });

  it('should show progress count', () => {
    render(<GoalsSection goals={mockGoals} />);
    expect(screen.getByText('1/3 completed')).toBeInTheDocument();
  });

  it('should render check icon for completed goals', () => {
    render(<GoalsSection goals={mockGoals} />);
    const checkIcons = screen.getAllByTestId('icon-check');
    expect(checkIcons).toHaveLength(1);
  });

  it('should render circle icon for incomplete goals', () => {
    render(<GoalsSection goals={mockGoals} />);
    const circleIcons = screen.getAllByTestId('icon-circle');
    expect(circleIcons).toHaveLength(2);
  });

  it('should show empty state when no goals', () => {
    render(<GoalsSection goals={[]} />);
    expect(screen.getByText('No goals set yet')).toBeInTheDocument();
    expect(screen.getByTestId('icon-target')).toBeInTheDocument();
  });

  it('should show Add Goal button', () => {
    render(<GoalsSection goals={mockGoals} />);
    expect(screen.getByText('Add Goal')).toBeInTheDocument();
  });

  it('should show add goal form when Add Goal is clicked', () => {
    render(<GoalsSection goals={mockGoals} />);
    fireEvent.click(screen.getByText('Add Goal'));
    expect(screen.getByPlaceholderText('Enter goal...')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should hide add goal form when Cancel is clicked', () => {
    render(<GoalsSection goals={mockGoals} />);
    fireEvent.click(screen.getByText('Add Goal'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter goal...')).not.toBeInTheDocument();
  });

  it('should disable Save when goal input is empty', () => {
    render(<GoalsSection goals={mockGoals} />);
    fireEvent.click(screen.getByText('Add Goal'));
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should show 0/0 completed for empty goals', () => {
    render(<GoalsSection goals={[]} />);
    expect(screen.getByText('0/0 completed')).toBeInTheDocument();
  });
});
