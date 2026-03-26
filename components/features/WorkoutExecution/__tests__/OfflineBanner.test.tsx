/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  WifiOff: () => <span data-testid="icon-wifi-off" />,
  Wifi: () => <span data-testid="icon-wifi" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
}));

import OfflineBanner from '../OfflineBanner';

// Utility: set navigator.onLine
function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

describe('OfflineBanner', () => {
  afterEach(() => {
    setOnline(true); // reset
  });

  it('renders nothing when online', () => {
    setOnline(true);
    const { container } = render(<OfflineBanner />);
    // Banner should not be visible when online
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it('renders amber offline banner when navigator.onLine is false', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByText(/sync when you reconnect/i)).toBeInTheDocument();
  });

  it('shows offline icon when offline', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByTestId('icon-wifi-off')).toBeInTheDocument();
  });

  it('shows green syncing banner when back online after being offline', async () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();

    // Simulate coming back online
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(await screen.findByText(/back online|syncing/i)).toBeInTheDocument();
  });

  it('responds to offline event listener', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('shows full offline message text', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/workouts will sync when you reconnect/i)).toBeInTheDocument();
  });

  it('applies amber styling when offline', () => {
    setOnline(false);
    render(<OfflineBanner />);
    const banner = screen.getByRole('alert');
    // Check for amber/warning class
    expect(banner.className).toMatch(/amber|yellow|warning|offline/i);
  });

  it('shows green syncing banner with sync message', async () => {
    setOnline(false);
    render(<OfflineBanner />);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    const syncBanner = await screen.findByRole('alert');
    expect(syncBanner.className).toMatch(/green|success|online|sync/i);
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    setOnline(true);
    const { unmount } = render(<OfflineBanner />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
