/** @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import SyncStatus from '@/components/shared/SyncStatus';

// Mock useOfflineQueue hook
const mockSync = jest.fn().mockResolvedValue({ synced: 1, failed: 0, conflicts: 0, errors: [] });
let mockQueueLength = 0;
let mockIsSyncing = false;

jest.mock('@/hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => ({
    queueLength: mockQueueLength,
    isSyncing: mockIsSyncing,
    sync: mockSync,
    addToQueue: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  RefreshCw: ({ className, ...props }: any) => <span data-testid="refresh-icon" className={className} {...props} />,
  Cloud: ({ className, ...props }: any) => <span data-testid="cloud-icon" className={className} {...props} />,
  Loader2: ({ className, ...props }: any) => <span data-testid="loader-icon" className={className} {...props} />,
}));

describe('SyncStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueLength = 0;
    mockIsSyncing = false;
    localStorage.clear();
  });

  it('renders nothing when queue is empty', () => {
    mockQueueLength = 0;
    const { container } = render(<SyncStatus />);
    expect(container.innerHTML).toBe('');
  });

  it('shows count badge when items are pending', () => {
    mockQueueLength = 3;
    render(<SyncStatus />);

    expect(screen.getByTestId('sync-count')).toHaveTextContent('3');
    expect(screen.getByText('3 pending')).toBeInTheDocument();
  });

  it('shows Sync Now button when items are pending', () => {
    mockQueueLength = 2;
    render(<SyncStatus />);

    expect(screen.getByTestId('sync-now-button')).toBeInTheDocument();
    expect(screen.getByText('Sync Now')).toBeInTheDocument();
  });

  it('triggers sync when Sync Now button is clicked', async () => {
    mockQueueLength = 1;
    render(<SyncStatus />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('sync-now-button'));
    });

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('shows spinner during sync', () => {
    mockQueueLength = 1;
    mockIsSyncing = true;
    render(<SyncStatus />);

    expect(screen.getByTestId('sync-spinner')).toBeInTheDocument();
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('stores last sync time in localStorage after sync', async () => {
    mockQueueLength = 1;
    const beforeSync = Date.now();
    render(<SyncStatus />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('sync-now-button'));
    });

    const storedTime = localStorage.getItem('evofit-last-sync');
    expect(storedTime).toBeTruthy();
    expect(parseInt(storedTime!, 10)).toBeGreaterThanOrEqual(beforeSync);
  });

  it('shows last sync time when available', () => {
    // Set a recent sync time (2 minutes ago)
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    localStorage.setItem('evofit-last-sync', String(twoMinutesAgo));
    mockQueueLength = 1;

    render(<SyncStatus />);

    expect(screen.getByTestId('last-sync-time')).toBeInTheDocument();
    expect(screen.getByTestId('last-sync-time').textContent).toContain('Last synced:');
  });

  it('renders the sync-status container when items are pending', () => {
    mockQueueLength = 5;
    render(<SyncStatus />);

    expect(screen.getByTestId('sync-status')).toBeInTheDocument();
  });
});
