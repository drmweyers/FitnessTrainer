/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Zap: () => <span data-testid="icon-zap" />,
  Clock: () => <span data-testid="icon-clock" />,
  Battery: () => <span data-testid="icon-battery" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  X: () => <span data-testid="icon-x" />,
  Settings: () => <span data-testid="icon-settings" />,
}));

jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, disabled, className, variant, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...rest}>
      {children}
    </button>
  ),
}));

import ModificationTemplates, { ModificationType } from '../ModificationTemplates';

const mockExercises = [
  {
    exerciseId: 'ex-1',
    exerciseName: 'Bench Press',
    category: 'compound',
    sets: [{ weight: 100, reps: 5, completed: false }],
  },
  {
    exerciseId: 'ex-2',
    exerciseName: 'Tricep Pushdown',
    category: 'accessory',
    sets: [{ weight: 40, reps: 12, completed: false }],
  },
];

const defaultProps = {
  onModify: jest.fn(),
  remainingExercises: mockExercises,
};

describe('ModificationTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating action button (FAB)', () => {
    render(<ModificationTemplates {...defaultProps} />);
    const fab = screen.getByRole('button', { name: /modify workout|adjust|options/i });
    expect(fab).toBeInTheDocument();
  });

  it('opens the bottom sheet when FAB is clicked', () => {
    render(<ModificationTemplates {...defaultProps} />);
    const fab = screen.getByRole('button', { name: /modify workout|adjust|options/i });
    fireEvent.click(fab);
    expect(screen.getByText(/feeling great/i)).toBeInTheDocument();
    expect(screen.getByText(/time crunch/i)).toBeInTheDocument();
    expect(screen.getByText(/low energy/i)).toBeInTheDocument();
    expect(screen.getByText(/equipment unavailable/i)).toBeInTheDocument();
  });

  it('closes the bottom sheet when close button is clicked', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    expect(screen.getByText(/feeling great/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/feeling great/i)).not.toBeInTheDocument();
  });

  it('calls onModify with FEELING_GREAT when that option is selected', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    fireEvent.click(screen.getByRole('button', { name: /feeling great/i }));
    expect(defaultProps.onModify).toHaveBeenCalledWith('FEELING_GREAT');
  });

  it('calls onModify with TIME_CRUNCH when that option is selected', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    fireEvent.click(screen.getByRole('button', { name: /time crunch/i }));
    expect(defaultProps.onModify).toHaveBeenCalledWith('TIME_CRUNCH');
  });

  it('calls onModify with LOW_ENERGY when that option is selected', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    fireEvent.click(screen.getByRole('button', { name: /low energy/i }));
    expect(defaultProps.onModify).toHaveBeenCalledWith('LOW_ENERGY');
  });

  it('calls onModify with EQUIPMENT_UNAVAILABLE when that option is selected', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    fireEvent.click(screen.getByRole('button', { name: /equipment unavailable/i }));
    expect(defaultProps.onModify).toHaveBeenCalledWith('EQUIPMENT_UNAVAILABLE');
  });

  it('shows description for each template option', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    expect(screen.getByText(/\+10%/)).toBeInTheDocument();
    expect(screen.getByText(/-20%/)).toBeInTheDocument();
    expect(screen.getByText(/accessory|compounds/i)).toBeInTheDocument();
  });

  it('closes the sheet after an option is selected', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    fireEvent.click(screen.getByRole('button', { name: /feeling great/i }));
    expect(screen.queryByText(/time crunch/i)).not.toBeInTheDocument();
  });

  it('shows remaining exercise count context', () => {
    render(<ModificationTemplates {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /modify workout|adjust|options/i }));
    // Should show count of remaining exercises for context — multiple elements may match "remaining"
    const remainingText = screen.getAllByText(/remaining/i);
    expect(remainingText.length).toBeGreaterThan(0);
    // The context paragraph should mention the count
    expect(screen.getByText(/2 exercise/i)).toBeInTheDocument();
  });
});
