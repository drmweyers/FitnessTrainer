/**
 * @jest-environment jsdom
 */

import {
  requestPermission,
  subscribe,
  unsubscribe,
  isSubscribed,
  isPushSupported,
} from '@/lib/services/pushNotificationService';

const PUSH_SUBSCRIPTION_KEY = 'push_subscription';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.Mock;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  // Reset service worker mock
  delete (navigator as any).serviceWorker;
  delete (window as any).PushManager;
  delete (window as any).Notification;
});

describe('isPushSupported', () => {
  it('returns false when no PushManager', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      writable: true,
      configurable: true,
    });
    // PushManager not set
    expect(isPushSupported()).toBe(false);
  });

  it('returns true when all APIs are present', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'PushManager', {
      value: class {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: jest.fn() },
      writable: true,
      configurable: true,
    });
    expect(isPushSupported()).toBe(true);
  });
});

describe('isSubscribed', () => {
  it('returns false when no subscription in localStorage', () => {
    expect(isSubscribed()).toBe(false);
  });

  it('returns true when subscription exists in localStorage', () => {
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify({ endpoint: 'https://example.com' }));
    expect(isSubscribed()).toBe(true);
  });
});

describe('requestPermission', () => {
  it('returns denied when Notification API not available', async () => {
    // No Notification on window
    const result = await requestPermission();
    expect(result).toBe('denied');
  });

  it('returns granted when permission is already granted', async () => {
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: jest.fn() },
      writable: true,
      configurable: true,
    });
    const result = await requestPermission();
    expect(result).toBe('granted');
  });

  it('calls requestPermission when not yet granted', async () => {
    const mockRequestPermission = jest.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: mockRequestPermission },
      writable: true,
      configurable: true,
    });
    const result = await requestPermission();
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(result).toBe('granted');
  });

  it('returns denied when user denies permission', async () => {
    const mockRequestPermission = jest.fn().mockResolvedValue('denied');
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: mockRequestPermission },
      writable: true,
      configurable: true,
    });
    const result = await requestPermission();
    expect(result).toBe('denied');
  });
});

describe('subscribe', () => {
  it('returns null when serviceWorker is not supported', async () => {
    const result = await subscribe('test-vapid-key');
    expect(result).toBeNull();
  });

  it('returns null when permission is denied', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: { subscribe: jest.fn() } }) },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'denied', requestPermission: jest.fn().mockResolvedValue('denied') },
      writable: true,
      configurable: true,
    });

    const result = await subscribe('test-vapid-key');
    expect(result).toBeNull();
  });

  it('stores subscription in localStorage on success', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/endpoint',
      toJSON: () => ({ endpoint: 'https://push.example.com/endpoint' }),
      unsubscribe: jest.fn(),
    };

    const mockPushManager = {
      subscribe: jest.fn().mockResolvedValue(mockSubscription),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: mockPushManager }) },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: jest.fn() },
      writable: true,
      configurable: true,
    });

    // Mock fetch for API sync
    mockFetch.mockResolvedValue({ ok: true });
    localStorage.setItem('accessToken', 'test-token');

    // Mock atob for base64 conversion
    global.atob = jest.fn().mockReturnValue('mock-binary-string');

    const result = await subscribe('dGVzdA==');
    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).not.toBeNull();
  });

  it('returns null on subscription error', async () => {
    const mockPushManager = {
      subscribe: jest.fn().mockRejectedValue(new Error('Subscription failed')),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: mockPushManager }) },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: jest.fn() },
      writable: true,
      configurable: true,
    });

    global.atob = jest.fn().mockReturnValue('mock-binary-string');

    const result = await subscribe('dGVzdA==');
    expect(result).toBeNull();
  });
});

describe('unsubscribe', () => {
  it('returns false when serviceWorker is not supported', async () => {
    const result = await unsubscribe();
    expect(result).toBe(false);
  });

  it('returns true and clears localStorage when no existing subscription', async () => {
    const mockPushManager = {
      getSubscription: jest.fn().mockResolvedValue(null),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: mockPushManager }) },
      writable: true,
      configurable: true,
    });

    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'old-sub');

    const result = await unsubscribe();
    expect(result).toBe(true);
    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
  });

  it('calls subscription.unsubscribe and removes from localStorage', async () => {
    const mockSub = {
      toJSON: () => ({ endpoint: 'https://push.example.com' }),
      unsubscribe: jest.fn().mockResolvedValue(true),
    };

    const mockPushManager = {
      getSubscription: jest.fn().mockResolvedValue(mockSub),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: mockPushManager }) },
      writable: true,
      configurable: true,
    });

    mockFetch.mockResolvedValue({ ok: true });
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify({ endpoint: 'https://push.example.com' }));

    const result = await unsubscribe();
    expect(mockSub.unsubscribe).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(localStorage.getItem(PUSH_SUBSCRIPTION_KEY)).toBeNull();
  });

  it('returns false on error', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: { getSubscription: jest.fn().mockRejectedValue(new Error('SW error')) } }) },
      writable: true,
      configurable: true,
    });

    const result = await unsubscribe();
    expect(result).toBe(false);
  });
});
