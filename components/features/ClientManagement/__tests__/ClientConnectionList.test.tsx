/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-users" />,
  Plus: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
  Filter: () => <span data-testid="icon-filter" />,
  MoreVertical: () => <span data-testid="icon-more" />,
  MessageCircle: () => <span data-testid="icon-message" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  Clock: () => <span data-testid="icon-clock" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Pause: () => <span data-testid="icon-pause" />,
  Archive: () => <span data-testid="icon-archive" />,
}));

import ClientConnectionList from '../ClientConnectionList';

describe('ClientConnectionList', () => {
  const mockOnInviteClient = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show loading skeleton initially', () => {
    const { container } = render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show client list after loading', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.getByText(/My Clients/)).toBeInTheDocument();
    expect(screen.getByText('sarah.johnson@example.com')).toBeInTheDocument();
    expect(screen.getByText('mike.chen@example.com')).toBeInTheDocument();
  });

  it('should show stats after loading', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    // "Active"/"Pending" etc. appear in both stats and select dropdown
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should display client names from userProfile bio', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();
  });

  it('should display fitness levels', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.getByText(/Level: intermediate/)).toBeInTheDocument();
    expect(screen.getByText(/Level: beginner/)).toBeInTheDocument();
  });

  it('should call onInviteClient when Invite Client button is clicked', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    fireEvent.click(screen.getByText('Invite Client'));
    expect(mockOnInviteClient).toHaveBeenCalledTimes(1);
  });

  it('should filter clients by search term', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    const searchInput = screen.getByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'sarah' } });
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument();
  });

  it('should filter clients by status', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
  });

  it('should show empty state when no clients match search', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    const searchInput = screen.getByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'zzzzzzz' } });
    expect(screen.getByText('No clients match your search')).toBeInTheDocument();
  });

  it('should show status badges for each client', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    const activeStatuses = screen.getAllByText('active');
    expect(activeStatuses.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should show action buttons for active clients', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    const messageIcons = screen.getAllByTestId('icon-message');
    expect(messageIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('should display avatar initials', () => {
    render(<ClientConnectionList onInviteClient={mockOnInviteClient} />);
    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });
});
