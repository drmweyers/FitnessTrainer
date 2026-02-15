/** @jest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServiceWorker } from '../useServiceWorker';

describe('useServiceWorker', () => {
  let mockRegistration: any;
  let mockServiceWorker: any;

  beforeEach(() => {
    // Mock service worker
    mockServiceWorker = {
      state: 'installing',
      addEventListener: jest.fn(),
    };

    mockRegistration = {
      installing: mockServiceWorker,
      waiting: null,
      addEventListener: jest.fn(),
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: jest.fn().mockResolvedValue(mockRegistration),
        controller: null,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register service worker on mount', async () => {
    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });
  });

  it('should set registration after successful registration', async () => {
    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.registration).toBe(mockRegistration);
    });
  });

  it('should detect when update is available', async () => {
    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.registration).toBe(mockRegistration);
    });

    // Simulate update found
    const updateFoundCallback = mockRegistration.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'updatefound'
    )?.[1];

    act(() => {
      updateFoundCallback?.();
    });

    // Simulate new worker installed with existing controller
    (navigator.serviceWorker as any).controller = {};
    const stateChangeCallback = mockServiceWorker.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'statechange'
    )?.[1];

    act(() => {
      mockServiceWorker.state = 'installed';
      stateChangeCallback?.();
    });

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });
  });

  it('should call skipWaiting and reload when skipWaiting is invoked', async () => {
    const mockWaiting = {
      postMessage: jest.fn(),
    };
    mockRegistration.waiting = mockWaiting;

    // Mock window.location.reload
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadSpy },
    });

    const { result } = renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(result.current.registration).toBe(mockRegistration);
    });

    act(() => {
      result.current.skipWaiting();
    });

    expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should handle registration errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));

    renderHook(() => useServiceWorker());

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('SW registration failed:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
