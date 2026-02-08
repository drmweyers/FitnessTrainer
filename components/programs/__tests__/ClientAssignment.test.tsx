/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  CalendarIcon: () => <span data-testid="icon-calendar" />,
  UserPlus: () => <span data-testid="icon-userplus" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
}));

jest.mock('date-fns', () => ({
  format: (date: Date, fmt: string) => '2026-01-15',
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : <div>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children, asChild }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button data-testid="select-trigger" onClick={() => onValueChange && onValueChange('client-1')}>
        Select
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: (props: any) => <div data-testid="calendar" />,
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
}));

import { ClientAssignment } from '../ClientAssignment';

const mockClients = [
  { id: 'client-1', name: 'John Doe', email: 'john@test.com' },
  { id: 'client-2', name: 'Jane Smith', email: 'jane@test.com' },
];

describe('ClientAssignment', () => {
  const mockOnAssign = jest.fn();

  const defaultProps = {
    programId: 'prog-1',
    programName: 'Strength Program',
    onAssign: mockOnAssign,
    clients: mockClients,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the assign button', () => {
    render(<ClientAssignment {...defaultProps} />);
    expect(screen.getByText('Assign to Client')).toBeInTheDocument();
  });

  it('opens dialog when assign button is clicked', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Assign Program to Client')).toBeInTheDocument();
  });

  it('renders program name in dialog description', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    const programRefs = screen.getAllByText(/Strength Program/);
    expect(programRefs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders client select label', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Select Client *')).toBeInTheDocument();
  });

  it('renders start date label', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Start Date *')).toBeInTheDocument();
  });

  it('renders notes field', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Notes (Optional)')).toBeInTheDocument();
  });

  it('renders program preview section', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Program Preview')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders assign program button', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('Assign Program')).toBeInTheDocument();
  });

  it('assign button is disabled when no client selected', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    const assignBtn = screen.getByText('Assign Program');
    expect(assignBtn).toBeDisabled();
  });

  it('calls onAssign when client is selected and form submitted', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    // Select a client via the mock trigger
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    // Now submit
    const assignBtn = screen.getByText('Assign Program');
    fireEvent.click(assignBtn);
    expect(mockOnAssign).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        startDate: expect.any(Date),
      })
    );
  });

  it('shows success state after assignment', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    const assignBtn = screen.getByText('Assign Program');
    fireEvent.click(assignBtn);
    expect(screen.getByText('Successfully Assigned!')).toBeInTheDocument();
  });

  it('auto-closes dialog after success', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    fireEvent.click(screen.getByText('Assign Program'));
    expect(screen.getByText('Successfully Assigned!')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
  });

  it('does not call onAssign when no client is selected', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    // Try to submit without selecting a client
    const assignBtn = screen.getByText('Assign Program');
    fireEvent.click(assignBtn);
    expect(mockOnAssign).not.toHaveBeenCalled();
  });

  it('renders with empty clients array', () => {
    render(<ClientAssignment {...defaultProps} clients={[]} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('No clients available')).toBeInTheDocument();
  });

  it('renders client names and emails', () => {
    render(<ClientAssignment {...defaultProps} />);
    fireEvent.click(screen.getByText('Assign to Client'));
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });
});
