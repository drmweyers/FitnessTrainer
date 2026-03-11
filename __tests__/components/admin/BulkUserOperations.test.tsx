/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkUserOperations } from '@/components/admin/BulkUserOperations';

const mockUsers = [
  { id: 'u1', email: 'alice@test.com', name: 'Alice', role: 'client', isActive: true },
  { id: 'u2', email: 'bob@test.com', name: 'Bob', role: 'trainer', isActive: true },
  { id: 'u3', email: 'charlie@test.com', name: 'Charlie', role: 'client', isActive: false },
];

describe('BulkUserOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when no users selected', () => {
    const { container } = render(
      <BulkUserOperations selectedUsers={new Set()} users={mockUsers} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders action bar with count when users selected', () => {
    render(
      <BulkUserOperations selectedUsers={new Set(['u1', 'u2'])} users={mockUsers} />
    );
    expect(screen.getByText('2 users selected')).toBeInTheDocument();
    expect(screen.getByText('Suspend Selected')).toBeInTheDocument();
    expect(screen.getByText('Activate Selected')).toBeInTheDocument();
  });

  it('renders singular text for single user', () => {
    render(
      <BulkUserOperations selectedUsers={new Set(['u1'])} users={mockUsers} />
    );
    expect(screen.getByText('1 user selected')).toBeInTheDocument();
  });

  it('"Suspend Selected" button opens confirm dialog', () => {
    render(
      <BulkUserOperations selectedUsers={new Set(['u1'])} users={mockUsers} />
    );
    fireEvent.click(screen.getByText('Suspend Selected'));
    expect(screen.getByText('Suspend Users')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('"Activate Selected" button opens confirm dialog', () => {
    render(
      <BulkUserOperations selectedUsers={new Set(['u1'])} users={mockUsers} />
    );
    fireEvent.click(screen.getByText('Activate Selected'));
    expect(screen.getByText('Activate Users')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('confirm calls API with correct payload for suspend', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
    const onComplete = jest.fn();

    render(
      <BulkUserOperations
        selectedUsers={new Set(['u1', 'u2'])}
        users={mockUsers}
        onOperationComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Suspend Selected'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ['u1', 'u2'], action: 'suspend' }),
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('confirm calls API with correct payload for activate', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
    const onComplete = jest.fn();

    render(
      <BulkUserOperations
        selectedUsers={new Set(['u3'])}
        users={mockUsers}
        onOperationComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Activate Selected'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ['u3'], action: 'activate' }),
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('cancel button closes confirm dialog', () => {
    render(
      <BulkUserOperations selectedUsers={new Set(['u1'])} users={mockUsers} />
    );
    fireEvent.click(screen.getByText('Suspend Selected'));
    expect(screen.getByText('Suspend Users')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Suspend Users')).not.toBeInTheDocument();
  });
});
