/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  GitMerge: () => <span data-testid="icon-git-merge" />,
  Server: () => <span data-testid="icon-server" />,
  Smartphone: () => <span data-testid="icon-smartphone" />,
  X: () => <span data-testid="icon-x" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant} {...rest}>
      {children}
    </button>
  ),
}));

import ConflictResolutionModal from '../ConflictResolutionModal';

const localConflict = {
  sets: [{ weight: 110, reps: 5 }],
  completedAt: '2026-03-26T10:05:00Z',
};

const serverConflict = {
  sets: [{ weight: 100, reps: 5 }],
  completedAt: '2026-03-26T10:00:00Z',
};

const defaultProps = {
  conflict: { local: localConflict, server: serverConflict },
  onResolve: jest.fn(),
};

describe('ConflictResolutionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the conflict resolution title', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    expect(screen.getByText(/conflict/i)).toBeInTheDocument();
  });

  it('shows "Server version" label', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    expect(screen.getByText(/server version/i)).toBeInTheDocument();
  });

  it('shows "Your version" label', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    expect(screen.getByText(/your version/i)).toBeInTheDocument();
  });

  it('displays local version data', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    // Should render some representation of local data
    expect(screen.getByText(/110/)).toBeInTheDocument();
  });

  it('displays server version data', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('calls onResolve with "local" when "Keep Mine" is clicked', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /keep mine/i }));
    expect(defaultProps.onResolve).toHaveBeenCalledWith('local');
  });

  it('calls onResolve with "server" when "Keep Server" is clicked', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /keep server/i }));
    expect(defaultProps.onResolve).toHaveBeenCalledWith('server');
  });

  it('does not call onResolve when "Cancel" is clicked', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onResolve).not.toHaveBeenCalled();
  });

  it('renders all three action buttons', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /keep mine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep server/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows side-by-side comparison layout', () => {
    const { container } = render(<ConflictResolutionModal {...defaultProps} />);
    // Both server and local sections should exist
    expect(screen.getByText(/server version/i)).toBeInTheDocument();
    expect(screen.getByText(/your version/i)).toBeInTheDocument();
  });

  it('shows explanation text about the conflict', () => {
    render(<ConflictResolutionModal {...defaultProps} />);
    // Multiple elements may match — use getAllBy and verify at least one exists
    const matches = screen.getAllByText(/different.*version|sync conflict|choose which/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
