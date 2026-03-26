/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkActionsToolbar from '../BulkActionsToolbar';

describe('BulkActionsToolbar', () => {
  const mockOnUpdateStatus = jest.fn();
  const mockOnAssignTag = jest.fn();
  const mockOnClearSelection = jest.fn();

  const defaultProps = {
    selectedCount: 3,
    onUpdateStatus: mockOnUpdateStatus,
    onAssignTag: mockOnAssignTag,
    onClearSelection: mockOnClearSelection,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the selection count', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('renders singular "selected" for 1 client', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={1} />);
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
  });

  it('renders "Clear Selection" button', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('calls onClearSelection when Clear Selection is clicked', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
  });

  it('renders Update Status button', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
  });

  it('shows status options dropdown when Update Status is clicked', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^inactive$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^onboarding$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^paused$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^archived$/i })).toBeInTheDocument();
  });

  it('calls onUpdateStatus with the selected status', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    fireEvent.click(screen.getByRole('button', { name: /^active$/i }));
    expect(mockOnUpdateStatus).toHaveBeenCalledWith('active');
  });

  it('calls onUpdateStatus with "archived" status', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    fireEvent.click(screen.getByRole('button', { name: /^archived$/i }));
    expect(mockOnUpdateStatus).toHaveBeenCalledWith('archived');
  });

  it('hides dropdown after status is selected', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    fireEvent.click(screen.getByRole('button', { name: /^active$/i }));
    expect(screen.queryByText(/^inactive$/i)).not.toBeInTheDocument();
  });

  it('renders Assign Tag button', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /assign tag/i })).toBeInTheDocument();
  });

  it('shows tag input when Assign Tag is clicked', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /assign tag/i }));
    expect(screen.getByPlaceholderText(/tag id or name/i)).toBeInTheDocument();
  });

  it('calls onAssignTag with the entered tag value', () => {
    render(<BulkActionsToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /assign tag/i }));
    const input = screen.getByPlaceholderText(/tag id or name/i);
    fireEvent.change(input, { target: { value: 'tag-abc' } });
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }));
    expect(mockOnAssignTag).toHaveBeenCalledWith('tag-abc');
  });

  it('does not render when selectedCount is 0', () => {
    const { container } = render(<BulkActionsToolbar {...defaultProps} selectedCount={0} />);
    expect(container.firstChild).toBeNull();
  });
});
